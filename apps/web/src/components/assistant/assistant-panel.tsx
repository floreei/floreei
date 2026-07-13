"use client";

import type { AiMessage, AssistantDraft } from "@sistema-flores/types";
import { Mic, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { useAssistantChat } from "@/lib/api/assistant";
import { useSpeech } from "@/lib/assistant/use-speech";
import { cn } from "@/lib/utils";
import { AssistantMessage } from "./assistant-message";
import { AssistantReviewDialog } from "./assistant-review-dialog";

interface Bubble {
  role: "user" | "assistant";
  text: string;
  href?: string;
}

const EXAMPLES = [
  "Pedido de 10 hortênsias para o fornecedor Holambra",
  "Marca o último pedido como entregue",
  "Quanto comprei este mês?",
];

export function AssistantPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const chat = useAssistantChat();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speech = useSpeech((text) =>
    setInput((prev) => (prev ? `${prev} ${text}` : text)),
  );

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
      const res = await chat.mutateAsync(nextMessages);
      setMessages(res.messages);
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
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {bubbles.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Diga o que você quer fazer. Eu confirmo tudo com você antes de
                  salvar.
                </p>
                <div className="space-y-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => send(ex)}
                      className="block w-full rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
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
                        className="mt-1 block font-medium underline"
                        onClick={() => onOpenChange(false)}
                      >
                        Ver compra →
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
            <div className="flex items-end gap-2">
              {speech.supported ? (
                <Button
                  type="button"
                  size="icon"
                  variant={speech.listening ? "default" : "outline"}
                  aria-label={speech.listening ? "Parar de gravar" : "Falar"}
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
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
        </SheetContent>
      </Sheet>

      {draft ? (
        <AssistantReviewDialog
          draft={draft}
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
