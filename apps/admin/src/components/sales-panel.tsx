"use client";

import type { SalesLead, SalesOverview } from "@sistema-flores/types";
import {
  CircleDollarSign,
  Clock,
  MessageCircle,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

/** Link do WhatsApp com mensagem pronta; null se o telefone não serve. */
function whatsappLink(phone: string | null, text: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

const TIER_LABEL: Record<string, string> = {
  ESSENCIAL: "Essencial",
  LOJA: "Loja",
  COMPLETO: "Completo",
};

/**
 * Cockpit de vendas do console: o dinheiro do funil (MRR) e as três listas de
 * abordagem — trial acabando, checkout não concluído e pagamento pendente —
 * cada uma com o WhatsApp pronto para chamar na hora certa.
 */
export function SalesPanel({ sales }: { sales: SalesOverview }) {
  const byTier = sales.byTier
    .map((t) => `${t.count} ${TIER_LABEL[t.tier] ?? t.tier}`)
    .join(" · ");

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground">Vendas</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita recorrente (MRR)"
          value={formatCurrency(sales.mrr)}
          hint={
            sales.subscribers > 0
              ? `${formatNumber(sales.subscribers)} assinantes${byTier ? ` · ${byTier}` : ""}`
              : "nenhuma assinatura ativa ainda"
          }
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Trials acabando"
          value={formatNumber(sales.trialsEndingSoon.length)}
          hint="vencem em até 3 dias"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Checkouts não concluídos"
          value={formatNumber(sales.pendingCheckouts.length)}
          hint="clicaram em assinar e pararam"
          icon={ShoppingCart}
        />
        <StatCard
          label="Pagamento pendente"
          value={formatNumber(sales.overdue.length)}
          hint="cobrança falhou ou cancelou"
          icon={AlertTriangle}
          tone={sales.overdue.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LeadList
          title="Trial acabando — chame agora"
          empty="Nenhum trial vencendo nos próximos 3 dias."
          leads={sales.trialsEndingSoon.map((l) => ({
            lead: l,
            info:
              l.trialDaysLeft <= 0
                ? "vence hoje"
                : `${l.trialDaysLeft} ${l.trialDaysLeft === 1 ? "dia" : "dias"} restantes`,
            message: `Olá! Aqui é do Floreei. Vi que o período gratuito da ${l.name} está acabando — posso te ajudar a escolher o melhor plano?`,
          }))}
        />
        <LeadList
          title="Checkout não concluído"
          empty="Nenhum pagamento parado no meio do caminho."
          leads={sales.pendingCheckouts.map((l) => ({
            lead: l,
            info: `plano ${TIER_LABEL[l.tier] ?? l.tier}`,
            message: `Olá! Vi que você começou a assinatura do Floreei e o pagamento não foi concluído. Posso te ajudar a finalizar?`,
          }))}
        />
        <LeadList
          title="Pagamento pendente"
          empty="Nenhum assinante com pagamento pendente."
          leads={sales.overdue.map((l) => ({
            lead: l,
            info:
              l.graceDaysLeft === null
                ? "acesso bloqueado"
                : `${l.graceDaysLeft} ${l.graceDaysLeft === 1 ? "dia" : "dias"} de carência`,
            message: `Olá! O pagamento da assinatura do Floreei não foi aprovado. Posso te ajudar a regularizar para você não perder o acesso?`,
          }))}
        />
      </div>
    </section>
  );
}

function LeadList({
  title,
  empty,
  leads,
}: {
  title: string;
  empty: string;
  leads: { lead: SalesLead; info: string; message: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          leads.slice(0, 6).map(({ lead, info, message }) => {
            const wa = whatsappLink(lead.phone, message);
            return (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/empresas/${lead.id}`}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {lead.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{info}</p>
                </div>
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-success/10 px-2.5 text-xs font-medium text-success hover:bg-success/20"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    sem telefone
                  </span>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
