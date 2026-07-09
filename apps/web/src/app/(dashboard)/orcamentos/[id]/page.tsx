"use client";

import { ArrowLeft, CalendarHeart, Copy, MoreHorizontal, Printer, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { QuoteBuilder } from "@/components/quotes/quote-builder";
import { ConvertDialog } from "@/components/quotes/convert-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  useChangeQuoteStatus,
  useDeleteQuote,
  useDuplicateQuote,
  useQuote,
} from "@/lib/api/quotes";
import { useAuth } from "@/lib/auth/auth-context";
import { unitLabels } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: quote, isLoading } = useQuote(params.id);
  const changeStatus = useChangeQuoteStatus();
  const duplicate = useDuplicateQuote();
  const remove = useDeleteQuote();
  const router = useRouter();
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || !quote) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const editable =
    quote.status !== "APPROVED" && quote.status !== "CANCELED";
  const convertible = quote.status === "DRAFT" || quote.status === "SENT";

  const updateStatus = async (status: "SENT" | "DRAFT" | "CANCELED") => {
    try {
      await changeStatus.mutateAsync({ id: quote.id, status });
      toast.success(
        status === "CANCELED" ? "Pedido cancelado." : "Status atualizado.",
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro.");
    }
  };

  const cancellable = !["APPROVED", "CANCELED"].includes(quote.status);
  // Convertido em evento (eventId) não pode ser excluído — o backend também barra.
  const deletable = user?.role === "ADMIN" && !quote.eventId;

  return (
    <div className="space-y-6">
      <Link
        href="/orcamentos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Orçamentos
      </Link>

      <PageHeader
        title={`Orçamento #${quote.number}`}
        description={quote.customer?.name}
      >
        <QuoteStatusBadge status={quote.status} />
        <Button asChild variant="outline">
          <Link href={`/orcamentos/${quote.id}/imprimir`}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Link>
        </Button>
        <Button
          variant="outline"
          disabled={duplicate.isPending}
          onClick={async () => {
            try {
              const copy = await duplicate.mutateAsync(quote.id);
              toast.success(`Orçamento #${copy.number} criado.`);
              router.push(`/orcamentos/${copy.id}`);
            } catch {
              toast.error("Não foi possível duplicar.");
            }
          }}
        >
          <Copy className="h-4 w-4" />
          Duplicar
        </Button>
        {quote.status === "DRAFT" ? (
          <Button variant="outline" onClick={() => updateStatus("SENT")}>
            <Send className="h-4 w-4" />
            Marcar enviado
          </Button>
        ) : null}
        {convertible ? (
          <Button onClick={() => setConvertOpen(true)}>
            <CalendarHeart className="h-4 w-4" />
            Converter em venda
          </Button>
        ) : null}
        {quote.eventId ? (
          <Button asChild variant="outline">
            <Link href={`/vendas/${quote.eventId}`}>Ver venda</Link>
          </Button>
        ) : null}
        {cancellable || deletable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Mais ações">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {cancellable ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => updateStatus("CANCELED")}
                >
                  Cancelar
                </DropdownMenuItem>
              ) : null}
              {deletable ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Excluir
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </PageHeader>

      {editable ? (
        <QuoteBuilder quote={quote} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border">
              {quote.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {unitLabels[item.unit]} ·{" "}
                      {formatCurrency(item.salePrice)} cada
                    </p>
                  </div>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(item.lineSale)}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="ml-auto max-w-xs space-y-2">
              <Row label="Custo" value={formatCurrency(quote.totalCost)} />
              <Row label="Venda" value={formatCurrency(quote.totalSale)} strong />
              <Row label="Lucro" value={formatCurrency(quote.totalProfit)} />
              <Row label="Margem" value={formatPercent(quote.marginPct)} />
            </div>
          </CardContent>
        </Card>
      )}

      <ConvertDialog open={convertOpen} onOpenChange={setConvertOpen} quote={quote} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir orçamento"
        description={`Excluir o orçamento #${quote.number}? Esta ação não pode ser desfeita.`}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(quote.id);
            toast.success("Orçamento excluído.");
            router.push("/orcamentos");
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : "Não foi possível excluir.",
            );
          }
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${strong ? "text-base font-semibold" : "text-sm"}`}>
        {value}
      </span>
    </div>
  );
}
