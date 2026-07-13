"use client";

import type {
  AiMessage,
  AssistantDraft,
  AssistantUsageSummary,
} from "@sistema-flores/types";
import {
  Eraser,
  ExternalLink,
  History,
  Mic,
  Search,
  Send,
  ShoppingBasket,
  Sparkles,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { useAssistantChat, useAssistantUsage } from "@/lib/api/assistant";
import { useSpeech } from "@/lib/assistant/use-speech";
import { cn } from "@/lib/utils";
import { AssistantHistoryView } from "./assistant-history-view";
import { AssistantMessage } from "./assistant-message";
import { AssistantReviewDialog } from "./assistant-review-dialog";

interface Bubble {
  role: "user" | "assistant";
  text: string;
  href?: string;
}

const EXAMPLES = [
  "Vendi 3 buquês para a Maria por R$ 150",
  "Pedido de 10 hortênsias para o fornecedor Holambra",
  "Quanto faturei essa semana?",
  "O que está acabando no estoque?",
];

export function AssistantPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const chat = useAssistantChat();
  const usage = useAssistantUsage(open);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [view, setView] = useState<"chat" | "history">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  // Texto que já estava no input quando o microfone começou — a fala é
  // acrescentada por cima, ao vivo (o reconhecimento manda a frase inteira).
  const dictationBase = useRef("");

  const speech = useSpeech((text) => {
    const base = dictationBase.current;
    setInput(base ? `${base} ${text}` : text);
  });

  const toggleMic = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      dictationBase.current = input.trim();
      speech.start();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setBubbles([]);
    setInput("");
    setDraft(null);
    setReviewOpen(false);
    setConversationId(null);
    setView("chat");
  };

  const scrollDown = () =>
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || chat.isPending) return;
    setInput("");
    const nextMessages: AiMessage[] = [...messages, { role: "user", text: clean }];
    setBubbles((b) => [...b, { role: "user", text: clean }]);
    scrollDown();
    try {
      const res = await chat.mutateAsync({ messages: nextMessages, conversationId });
      setMessages(res.messages);
      if (res.conversationId) setConversationId(res.conversationId);
      if (res.reply) setBubbles((b) => [...b, { role: "assistant", text: res.reply! }]);
      if (res.draft) {
        setDraft(res.draft);
        setReviewOpen(true);
      }
    } catch (err) {
      const text =
        err instanceof ApiError && err.status === 503
          ? "O assistente ainda não está ligado nesta conta. Fale com o suporte para ativar."
          : err instanceof ApiError && err.message
            ? err.message
            : "Tive um problema agora. Pode tentar de novo?";
      setBubbles((b) => [...b, { role: "assistant", text }]);
    }
    scrollDown();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
        >
          <header className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold leading-tight">Assistente</p>
              <p className="text-xs text-muted-foreground">
                Peça por texto ou voz — ex.: pedidos a fornecedor
              </p>
            </div>
            <div className="ml-auto mr-7 flex items-center gap-1">
              {view === "chat" && bubbles.length > 0 ? (
                <button
                  type="button"
                  onClick={clearChat}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setView(view === "history" ? "chat" : "history")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-muted",
                  view === "history"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <History className="h-3.5 w-3.5" />
                {view === "history" ? "Conversar" : "Histórico"}
              </button>
            </div>
          </header>

          {view === "history" ? (
            <AssistantHistoryView onOpenChange={onOpenChange} />
          ) : (
          <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {bubbles.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                <style>{`
                  @keyframes assistant-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                  }
                `}</style>

                {/* Ícone herói com brilho */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/30 blur-2xl" />
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-primary via-primary to-primary/60 text-primary-foreground shadow-lg ring-1 ring-white/25 motion-safe:[animation:assistant-float_4s_ease-in-out_infinite]"
                  >
                    <Sparkles className="h-9 w-9" />
                  </div>
                </div>

                <h2 className="font-serif text-xl font-semibold">Seu assistente</h2>
                <p className="mt-1.5 max-w-[18rem] text-sm text-muted-foreground">
                  Peça por texto ou voz. Eu busco no seu sistema, confirmo com
                  você e só então registro —{" "}
                  <span className="font-medium text-foreground">
                    vendas, compras, cadastros, estoque e financeiro
                  </span>
                  .
                </p>

                <div className="mt-5 grid w-full max-w-xs gap-2 text-left">
                  <Capability icon={ShoppingBasket}>
                    Registrar vendas e compras — crio cliente, fornecedor e
                    produto se faltarem
                  </Capability>
                  <Capability icon={Truck}>
                    Cadastrar cliente/produto/buquê, ajustar estoque, lançar
                    despesa e dar baixa
                  </Capability>
                  <Capability icon={Search}>
                    Consultar vendas/faturamento, financeiro e estoque
                  </Capability>
                </div>

                <div className="mt-6 w-full max-w-xs space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    Experimente
                  </p>
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => send(ex)}
                      className="block w-full rounded-xl border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              bubbles.map((b, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex duration-300 animate-in fade-in-0 slide-in-from-bottom-1",
                    b.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                      b.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {b.role === "assistant" ? (
                      <AssistantMessage text={b.text} />
                    ) : (
                      b.text
                    )}
                    {b.href ? (
                      <Link
                        href={b.href}
                        onClick={() => onOpenChange(false)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Abrir a compra
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {chat.isPending ? (
              <div className="flex justify-start duration-300 animate-in fade-in-0">
                <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                  <TypingDots />
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-3">
            {usage.data ? <UsageBar usage={usage.data} /> : null}
            <div className="flex items-end gap-2">
              {speech.supported ? (
                <Button
                  type="button"
                  size="icon"
                  variant={speech.listening ? "default" : "outline"}
                  aria-label={speech.listening ? "Parar de gravar" : "Falar"}
                  className={speech.listening ? "animate-pulse" : undefined}
                  onClick={toggleMic}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              ) : null}
              <Textarea
                rows={1}
                value={input}
                placeholder={speech.listening ? "Ouvindo…" : "Escreva ou fale…"}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                className="max-h-32 min-h-[2.5rem] flex-1 resize-none"
              />
              <Button
                type="button"
                size="icon"
                aria-label="Enviar"
                disabled={!input.trim() || chat.isPending}
                onClick={() => void send(input)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </>
          )}
        </SheetContent>
      </Sheet>

      {draft ? (
        <AssistantReviewDialog
          draft={draft}
          conversationId={conversationId}
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          onDone={(result) => {
            setBubbles((b) => [
              ...b,
              { role: "assistant", text: result.message, href: result.href },
            ]);
            // Recomeça a conversa após concluir uma ação.
            setMessages([]);
            setDraft(null);
          }}
        />
      ) : null}
    </>
  );
}

/** Uma capacidade do assistente na tela inicial (ícone + texto). */
function Capability({
  icon: Icon,
  children,
}: {
  icon: typeof ShoppingBasket;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3 w-3" />
      </span>
      <span>{children}</span>
    </div>
  );
}

/** Barra de uso do assistente no mês, com quanto ainda está disponível (%). */
function UsageBar({ usage }: { usage: AssistantUsageSummary }) {
  const usedPct =
    usage.quota > 0
      ? Math.min(100, Math.round((usage.monthTokens / usage.quota) * 100))
      : 0;
  const availablePct = Math.max(0, 100 - usedPct);
  const low = usage.remaining <= 0 || usedPct >= 90;
  const mid = !low && usedPct >= 70;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Assistente — uso do mês</span>
        <span className={cn("tabular-nums", low && "font-medium text-destructive")}>
          {usage.remaining <= 0
            ? "limite do mês atingido"
            : `${availablePct}% disponível`}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            low ? "bg-destructive" : mid ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}

/** Indicador de digitação: três pontinhos com um "quique" suave e escalonado. */
function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-label="Digitando…" role="status">
      <style>{`
        @keyframes assistant-typing {
          0%, 60%, 100% { opacity: 0.35; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-muted-foreground/70 motion-reduce:animate-none"
          style={{
            animation: "assistant-typing 1.2s ease-in-out infinite",
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </span>
  );
}
