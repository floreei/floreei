"use client";

import { attachmentInputSchema, type Payment } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ExternalLink,
  HandCoins,
  Link2,
  PackageCheck,
  Paperclip,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { PurchaseDialog } from "@/components/purchases/purchase-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Field } from "@/components/shared/field";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeletePurchasePayment,
  usePurchasePayments,
} from "@/lib/api/finance";
import {
  useAddPurchaseAttachment,
  useDeletePurchase,
  useDeletePurchaseAttachment,
  usePurchase,
  usePurchaseAttachments,
  useReceivePurchase,
  useUnreceivePurchase,
} from "@/lib/api/purchases";
import { formatCurrency, formatDate } from "@/lib/utils";

const methodLabels: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  BOLETO: "Boleto",
  OTHER: "Outro",
};

export default function PurchaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: purchase, isLoading } = usePurchase(params.id);
  const receive = useReceivePurchase();
  const unreceive = useUnreceivePurchase();
  const remove = useDeletePurchase();
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || !purchase) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isReceived = purchase.status === "RECEIVED";

  return (
    <div className="space-y-6">
      <Link
        href="/compras"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Compras
      </Link>

      <PageHeader
        title={purchase.supplier?.name ?? "Compra"}
        description={`Pedido de ${formatDate(purchase.date)}`}
      >
        {isReceived ? (
          <Button
            variant="outline"
            loading={unreceive.isPending}
            onClick={async () => {
              try {
                await unreceive.mutateAsync(purchase.id);
                toast.success("Entrega desfeita. Estoque estornado.");
              } catch {
                toast.error("Não foi possível desfazer.");
              }
            }}
          >
            <Undo2 className="h-4 w-4" />
            Desfazer entrega
          </Button>
        ) : (
          <Button
            loading={receive.isPending}
            onClick={async () => {
              try {
                await receive.mutateAsync(purchase.id);
                toast.success("Compra recebida. Entrou no estoque.");
              } catch {
                toast.error("Não foi possível receber.");
              }
            }}
          >
            <PackageCheck className="h-4 w-4" />
            Marcar como recebida
          </Button>
        )}
        <Button variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pedido</CardTitle>
            <Badge variant={isReceived ? "success" : "warning"}>
              {isReceived ? "Recebida" : "Aguardando entrega"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Fornecedor" value={purchase.supplier?.name ?? "—"} />
            <Row label="Data do pedido" value={formatDate(purchase.date)} />
            <Row
              label="Entrega prevista"
              value={
                purchase.deliveryDate
                  ? `${formatDate(purchase.deliveryDate)}${purchase.deliveryTime ? ` às ${purchase.deliveryTime}` : ""}`
                  : "—"
              }
            />
            {purchase.notes ? (
              <div className="pt-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Observações
                </p>
                <p className="mt-1">{purchase.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MoneyRow label="Itens" value={purchase.itemsTotal} />
            <MoneyRow label="Frete" value={purchase.freight} />
            <MoneyRow label="Total" value={purchase.total} strong />
            <MoneyRow label="Pago" value={purchase.paidAmount} />
            <MoneyRow
              label="Falta pagar"
              value={purchase.balanceDue}
              accent={purchase.balanceDue > 0}
            />
            {purchase.balanceDue > 0 ? (
              <Button className="w-full" variant="outline" onClick={() => setPayOpen(true)}>
                <HandCoins className="h-4 w-4" />
                Registrar pagamento
              </Button>
            ) : (
              <Badge variant="success" className="w-fit">
                Compra quitada
              </Badge>
            )}
            <PurchasePayments
              purchaseId={purchase.id}
              balanceDue={purchase.balanceDue}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flores / insumos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {purchase.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                    {item.productId ? null : " · fora do estoque"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCurrency(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Comprovantes purchaseId={purchase.id} />

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        mode="pay"
        targetId={purchase.id}
        balanceDue={purchase.balanceDue}
      />
      <PurchaseDialog open={editOpen} onOpenChange={setEditOpen} purchase={purchase} />
      <div className="flex justify-end">
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={purchase.paidAmount > 0}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
          Excluir compra
        </Button>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir compra"
        description="A compra será removida. O estoque dado por ela é estornado. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={async () => {
          await remove.mutateAsync(purchase.id);
          toast.success("Compra excluída.");
          router.push("/compras");
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: number;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums ${
          accent
            ? "font-semibold text-clay"
            : strong
              ? "text-base font-semibold"
              : "text-sm font-medium"
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function PurchasePayments({
  purchaseId,
  balanceDue,
}: {
  purchaseId: string;
  balanceDue: number;
}) {
  const { data: payments } = usePurchasePayments(purchaseId);
  const remove = useDeletePurchasePayment(purchaseId);
  const [editing, setEditing] = useState<Payment | null>(null);

  if (!payments || payments.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Pagamentos
      </p>
      {payments.map((p) => (
        <div key={p.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1 text-muted-foreground">
            {formatDate(p.date)} · {methodLabels[p.method] ?? p.method}
          </span>
          <span className="tabular-nums font-medium text-clay">
            − {formatCurrency(p.amount)}
          </span>
          <button
            type="button"
            aria-label="Editar pagamento"
            title="Editar pagamento"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setEditing(p)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Remover pagamento"
            title="Remover pagamento"
            className="text-muted-foreground transition-colors hover:text-destructive"
            onClick={async () => {
              try {
                await remove.mutateAsync(p.id);
                toast.success("Pagamento removido. Voltou para 'a pagar'.");
              } catch {
                toast.error("Não foi possível remover.");
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <PaymentDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="pay"
        targetId={purchaseId}
        balanceDue={balanceDue}
        payment={editing}
      />
    </div>
  );
}

function Comprovantes({ purchaseId }: { purchaseId: string }) {
  const { data, isLoading } = usePurchaseAttachments(purchaseId);
  const add = useAddPurchaseAttachment(purchaseId);
  const remove = useDeletePurchaseAttachment(purchaseId);
  const form = useForm({
    resolver: zodResolver(attachmentInputSchema),
    defaultValues: { label: "", url: "" },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comprovantes e anexos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cole o link do comprovante de pagamento, nota ou foto.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data && data.length > 0 ? (
          data.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-1.5 truncate text-sm font-medium text-primary hover:underline"
              >
                {att.label}
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
              <button
                type="button"
                aria-label="Remover anexo"
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={async () => {
                  try {
                    await remove.mutateAsync(att.id);
                    toast.success("Anexo removido.");
                  } catch {
                    toast.error("Erro ao remover.");
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum comprovante ainda.
          </p>
        )}

        <form
          className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-end"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await add.mutateAsync(values);
              toast.success("Comprovante anexado.");
              form.reset({ label: "", url: "" });
            } catch {
              toast.error("Não foi possível anexar.");
            }
          })}
        >
          <Field label="Nome" htmlFor="att-label" required className="sm:flex-1">
            <Input id="att-label" placeholder="Comprovante Pix" {...form.register("label")} />
          </Field>
          <Field label="Link" htmlFor="att-url" required className="sm:flex-[2]">
            <Input id="att-url" placeholder="https://…" {...form.register("url")} />
          </Field>
          <Button type="submit" loading={form.formState.isSubmitting}>
            <Link2 className="h-4 w-4" />
            Anexar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
