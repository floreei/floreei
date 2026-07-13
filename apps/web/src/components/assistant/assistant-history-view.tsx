"use client";

import { ArrowLeft, ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  useAssistantConversation,
  useAssistantConversations,
  useAssistantHistory,
} from "@/lib/api/assistant";
import { cn } from "@/lib/utils";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Histórico do assistente: ações executadas + conversas (com transcript). */
export function AssistantHistoryView({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const [openConv, setOpenConv] = useState<{ id: string; title: string } | null>(null);

  if (openConv) {
    return <Transcript conv={openConv} onBack={() => setOpenConv(null)} />;
  }

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-4">
      <ActionsSection onOpenChange={onOpenChange} />
      <ConversationsSection onOpen={(id, title) => setOpenConv({ id, title })} />
    </div>
  );
}

function ActionsSection({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useAssistantHistory();
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ações realizadas
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada registrado ainda.</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((a) => (
            <li key={a.id}>
              <Link
                href={a.href}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.summary}</span>
                  <span className="text-xs text-muted-foreground">{fmt(a.createdAt)}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ConversationsSection({
  onOpen,
}: {
  onOpen: (id: string, title: string) => void;
}) {
  const { data, isLoading } = useAssistantConversations();
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Conversas
      </h3>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onOpen(c.id, c.title)}
                className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5"
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{c.title}</span>
                  <span className="text-xs text-muted-foreground">{fmt(c.updatedAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Transcript({
  conv,
  onBack,
}: {
  conv: { id: string; title: string };
  onBack: () => void;
}) {
  const { data, isLoading } = useAssistantConversation(conv.id);
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <span className="truncate text-sm font-medium">{conv.title}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          data?.messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
