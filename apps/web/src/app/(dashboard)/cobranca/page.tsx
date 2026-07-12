"use client";

import type {
  DunningPaymentMethod,
  DunningStep,
} from "@sistema-flores/types";
import { DEFAULT_DUNNING_STEPS } from "@sistema-flores/types";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  useDunningLog,
  useDunningSettings,
  useUpdateDunningSettings,
} from "@/lib/api/dunning";
import { cn, formatDate } from "@/lib/utils";

const MP_LINK_HELP =
  "https://www.mercadopago.com.br/ferramentas-para-vender/link-de-pagamento";

function stepLabel(offset: number): string {
  if (offset < 0) return `${Math.abs(offset)} dia(s) antes do vencimento`;
  if (offset === 0) return "No dia do vencimento";
  return `${offset} dia(s) depois do vencimento`;
}

/** Prévia simples da mensagem (espelha o texto montado no servidor). */
function previewMessage(
  company: string,
  method: DunningPaymentMethod,
  pixKey: string,
  mpLink: string,
  extraLine: string,
): string {
  const lines = [
    "Olá, Maria! 🌸",
    "",
    `Sua compra na ${company || "sua floricultura"} de R$ 150,00 vence hoje (dd/mm/aaaa).`,
  ];
  if (method === "PIX" && pixKey) lines.push("", `Pra facilitar, o PIX é: ${pixKey}`);
  else if (method === "MP_LINK" && mpLink) lines.push("", `Você pode pagar por aqui: ${mpLink}`);
  if (extraLine) lines.push("", extraLine);
  lines.push("", "_Responda SAIR para não receber estes lembretes._");
  return lines.join("\n");
}

export default function CobrancaPage() {
  const { data, isLoading } = useDunningSettings();
  const { data: log } = useDunningLog();
  const save = useUpdateDunningSettings();

  const [enabled, setEnabled] = useState(false);
  const [steps, setSteps] = useState<DunningStep[]>(DEFAULT_DUNNING_STEPS);
  const [method, setMethod] = useState<DunningPaymentMethod>("NONE");
  const [pixKey, setPixKey] = useState("");
  const [mpLink, setMpLink] = useState("");
  const [extraLine, setExtraLine] = useState("");

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setSteps(data.steps.length ? data.steps : DEFAULT_DUNNING_STEPS);
    setMethod(data.paymentMethod);
    setPixKey(data.pixKey ?? "");
    setMpLink(data.mpLink ?? "");
    setExtraLine(data.extraLine ?? "");
  }, [data]);

  const setStep = (i: number, patch: Partial<DunningStep>) =>
    setSteps((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));

  const submit = async () => {
    try {
      await save.mutateAsync({
        enabled,
        steps,
        paymentMethod: method,
        pixKey: pixKey || undefined,
        mpLink: mpLink || undefined,
        extraLine: extraLine || undefined,
      });
      toast.success("Cobrança automática salva.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao salvar.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobrança automática"
        description="Lembretes de contas a receber enviados sozinhos por WhatsApp, na régua que você definir."
      >
        <Button onClick={submit} loading={save.isPending}>
          Salvar
        </Button>
      </PageHeader>

      {/* Liga/desliga */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium">Cobrança automática</p>
            <p className="text-sm text-muted-foreground">
              Quando ligada, o sistema envia os lembretes nos dias abaixo.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
              enabled ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                enabled ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </CardContent>
      </Card>

      {/* Régua (passos) */}
      <Card>
        <CardHeader>
          <CardTitle>Quando cobrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={st.enabled}
                onChange={(e) => setStep(i, { enabled: e.target.checked })}
              />
              <Input
                type="number"
                className="h-9 w-20 text-right"
                value={st.offsetDays}
                onChange={(e) =>
                  setStep(i, { offsetDays: Number(e.target.value) || 0 })
                }
              />
              <span className="flex-1 text-sm text-muted-foreground">
                {stepLabel(st.offsetDays)}
              </span>
              <button
                type="button"
                aria-label="Remover"
                className="p-1 text-muted-foreground hover:text-destructive"
                onClick={() => setSteps((s) => s.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSteps((s) => [...s, { offsetDays: 0, enabled: true }])
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar dia
          </Button>
          <p className="text-xs text-muted-foreground">
            Negativo = antes do vencimento · 0 = no dia · positivo = depois.
          </p>
        </CardContent>
      </Card>

      {/* Forma de pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Como o cliente paga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["PIX", "Chave PIX"],
                ["MP_LINK", "Link Mercado Pago"],
                ["NONE", "Sem pagamento"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  method === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {method === "PIX" ? (
            <div className="space-y-1">
              <Label htmlFor="pix">Chave PIX</Label>
              <Input
                id="pix"
                placeholder="e-mail, telefone, CPF/CNPJ ou aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>
          ) : null}

          {method === "MP_LINK" ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="mp">Link de pagamento do Mercado Pago</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Como criar seu link no Mercado Pago"
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="max-w-sm space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      Como criar seu link no Mercado Pago
                    </p>
                    <ol className="list-decimal space-y-1 pl-4">
                      <li>Entre na sua conta do Mercado Pago.</li>
                      <li>Vá em “Ferramentas para vender” → “Link de pagamento”.</li>
                      <li>Crie um link e copie a URL aqui.</li>
                    </ol>
                    <p>
                      <strong className="text-foreground">Importante:</strong> confira
                      as <strong className="text-foreground">taxas</strong> e configure
                      as <strong className="text-foreground">parcelas</strong> na
                      plataforma do Mercado Pago — isso é definido lá, não aqui.
                    </p>
                    <a
                      href={MP_LINK_HELP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block font-medium text-primary hover:underline"
                    >
                      Abrir o Mercado Pago →
                    </a>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                id="mp"
                placeholder="https://mpago.la/..."
                value={mpLink}
                onChange={(e) => setMpLink(e.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="extra">Linha extra (opcional)</Label>
            <Textarea
              id="extra"
              rows={2}
              placeholder="Ex.: Qualquer dúvida, é só me chamar por aqui!"
              value={extraLine}
              onChange={(e) => setExtraLine(e.target.value)}
            />
          </div>

          {/* Prévia */}
          <div className="space-y-1">
            <Label>Prévia da mensagem</Label>
            <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm">
              {previewMessage("sua floricultura", method, pixKey, mpLink, extraLine)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos envios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {log && log.length > 0 ? (
            <div className="divide-y divide-border">
              {log.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {l.customerName ?? "Cliente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(l.sentAt)} · {stepLabel(l.step)} · {l.channel}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      l.status === "SENT" ? "text-success" : "text-destructive",
                    )}
                  >
                    {l.status === "SENT" ? "Enviado" : "Falhou"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              Nenhum lembrete enviado ainda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
