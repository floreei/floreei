"use client";

import type { Payment } from "@sistema-flores/types";
import {
  ArrowLeft,
  HandCoins,
  MapPin,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AttachmentsCard } from "@/components/events/attachments-card";
import { EditSaleItemsDialog } from "@/components/events/edit-sale-items-dialog";
import { EventDialog } from "@/components/events/event-dialog";
import { PaymentDialog } from "@/components/finance/payment-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  EventStatusBadge,
  EventTypeBadge,
  PaymentStatusBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelEvent,
  useDeleteEvent,
  useEvent,
  useSaveEvent,
} from "@/lib/api/events";
import {
  useDeleteEventPayment,
  useEventPayments,
} from "@/lib/api/finance";
import { useAuth } from "@/lib/auth/auth-context";
import { unitLabels } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";

const methodLabels: Record<string, string> = {
  PIX: "Pix",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  BOLETO: "Boleto",
  OTHER: "Outro",
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: event, isLoading } = useEvent(params.id);
  const remove = useDeleteEvent();
  const cancel = useCancelEvent();
  const save = useSaveEvent(params.id);
  const [editOpen, setEditOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  if (isLoading || !event) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pending = event.soldValue - event.receivedValue;

  return (
    <div className="space-y-6">
      <Link
        href="/eventos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Eventos
      </Link>

      <PageHeader
        title={event.title}
        description={event.customer?.name ?? "Consumidor"}
      >
        {event.status !== "CANCELED" ? (
          <Button variant="outline" asChild>
            <Link href={`/eventos/${event.id}/imprimir`}>
              <Printer className="h-4 w-4" />
              Nota do pedido
            </Link>
          </Button>
        ) : null}
        {event.status !== "DONE" && event.status !== "CANCELED" ? (
          <Button
            variant="outline"
            loading={save.isPending}
            onClick={async () => {
              try {
                await save.mutateAsync({ status: "DONE" });
                toast.success("Venda marcada como entregue.");
              } catch {
                toast.error("Não foi possível atualizar.");
              }
            }}
          >
            <PackageCheck className="h-4 w-4" />
            Marcar entregue
          </Button>
        ) : null}
        {pending > 0 && event.status !== "CANCELED" ? (
          <Button onClick={() => setReceiveOpen(true)}>
            <HandCoins className="h-4 w-4" />
            Registrar recebimento
          </Button>
        ) : null}
        {event.status !== "CANCELED" || user?.role === "ADMIN" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Mais ações">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {event.status !== "CANCELED" ? (
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  Editar
                </DropdownMenuItem>
              ) : null}
              {user?.role === "ADMIN" && event.status !== "CANCELED" ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancelar venda
                </DropdownMenuItem>
              ) : null}
              {user?.role === "ADMIN" ? (
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

      {/* Status da venda */}
      <div className="flex flex-wrap items-center gap-2">
        <EventTypeBadge type={event.type} />
        <EventStatusBadge status={event.status} />
        <PaymentStatusBadge sold={event.soldValue} received={event.receivedValue} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label="Data" value={formatDate(event.date)} />
            <Detail
              label="Local"
              value={event.location ?? "—"}
              icon={<MapPin className="h-4 w-4" />}
            />
            <Detail label="Cliente" value={event.customer?.name ?? "Consumidor"} />
            <Detail
              label="Orçamento"
              value={
                event.quoteId ? (
                  <Link
                    href={`/orcamentos/${event.quoteId}`}
                    className="text-primary hover:underline"
                  >
                    Ver orçamento
                  </Link>
                ) : (
                  "Sem orçamento"
                )
              }
            />
            {event.notes ? (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Observações
                </p>
                <p className="mt-1 text-sm">{event.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Money label="Valor vendido" value={event.soldValue} strong />
            <Money label="Recebido" value={event.receivedValue} />
            <Money label="A receber" value={pending} accent={pending > 0} />
            <Money label="Lucro estimado" value={event.estimatedProfit} />
            <Recebimentos eventId={event.id} balanceDue={pending} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Itens vendidos</CardTitle>
          {user?.role === "ADMIN" && event.status !== "CANCELED" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditItemsOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              {event.items.length > 0 ? "Editar itens" : "Adicionar itens"}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {event.items.length > 0 ? (
            <div className="divide-y divide-border">
              {event.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {unitLabels[item.unit].toLowerCase()} ×{" "}
                      {formatCurrency(item.unitSalePrice)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatCurrency(item.lineTotal)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-muted/20 px-6 py-3">
                <span className="text-sm font-medium">Total</span>
                <span className="font-serif text-lg font-semibold tabular-nums">
                  {formatCurrency(event.soldValue)}
                </span>
              </div>
            </div>
          ) : (
            <p className="px-6 py-6 text-sm text-muted-foreground">
              Venda de valor livre — sem itens detalhados.
            </p>
          )}
        </CardContent>
      </Card>

      <AttachmentsCard eventId={event.id} />

      <PaymentDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        mode="receive"
        targetId={event.id}
        balanceDue={pending}
      />
      <EventDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      <EditSaleItemsDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        event={event}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar evento"
        description="O evento será marcado como cancelado e os insumos usados voltam ao estoque. Esta ação não pode ser desfeita."
        confirmLabel="Cancelar evento"
        onConfirm={async () => {
          await cancel.mutateAsync(event.id);
          toast.success("Evento cancelado. Estoque estornado.");
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir evento"
        description={`Excluir "${event.title}"? Esta ação não pode ser desfeita.`}
        onConfirm={async () => {
          await remove.mutateAsync(event.id);
          toast.success("Evento excluído.");
          router.push("/eventos");
        }}
      />
    </div>
  );
}

function Detail({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {value}
      </p>
    </div>
  );
}

function Money({
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

function Recebimentos({
  eventId,
  balanceDue,
}: {
  eventId: string;
  balanceDue: number;
}) {
  const { data: payments } = useEventPayments(eventId);
  const remove = useDeleteEventPayment(eventId);
  const [editing, setEditing] = useState<Payment | null>(null);

  if (!payments || payments.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Recebimentos
      </p>
      {payments.map((p) => (
        <div key={p.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1 text-muted-foreground">
            {formatDate(p.date)} · {methodLabels[p.method] ?? p.method}
          </span>
          <span className="tabular-nums font-medium text-success">
            + {formatCurrency(p.amount)}
          </span>
          <button
            type="button"
            aria-label="Editar recebimento"
            title="Editar recebimento"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setEditing(p)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Remover recebimento"
            title="Remover recebimento"
            className="text-muted-foreground transition-colors hover:text-destructive"
            onClick={async () => {
              try {
                await remove.mutateAsync(p.id);
                toast.success("Recebimento removido. Voltou para 'a receber'.");
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
        mode="receive"
        targetId={eventId}
        balanceDue={balanceDue}
        payment={editing}
      />
    </div>
  );
}
