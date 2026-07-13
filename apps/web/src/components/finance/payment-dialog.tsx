"use client";

import {
  paymentInputSchema,
  type Payment,
  type PaymentMethod,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  usePayForPurchase,
  useReceiveForEvent,
  useUpdateEventPayment,
  useUpdatePurchasePayment,
} from "@/lib/api/finance";
import { formatCurrency } from "@/lib/utils";

const methods: Array<[PaymentMethod, string]> = [
  ["PIX", "Pix"],
  ["CASH", "Dinheiro"],
  ["CARD", "Cartão"],
  ["TRANSFER", "Transferência"],
  ["BOLETO", "Boleto"],
  ["OTHER", "Outro"],
];

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "receive" | "pay";
  targetId: string;
  balanceDue: number;
  /** Quando informado, o diálogo edita este pagamento em vez de criar um novo. */
  payment?: Payment | null;
  /** Chave Pix de quem vai receber (fornecedor), para pagar por Pix na hora. */
  payeePixKey?: string | null;
}

export function PaymentDialog({
  open,
  onOpenChange,
  mode,
  targetId,
  balanceDue,
  payment,
  payeePixKey,
}: PaymentDialogProps) {
  const receive = useReceiveForEvent();
  const pay = usePayForPurchase();
  const updateEvent = useUpdateEventPayment(targetId);
  const updatePurchase = useUpdatePurchasePayment(targetId);
  const isEdit = Boolean(payment);
  const isReceive = mode === "receive";
  const [copied, setCopied] = useState(false);

  const copyPix = async () => {
    if (!payeePixKey) return;
    try {
      await navigator.clipboard.writeText(payeePixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível: a chave segue visível para cópia manual.
    }
  };
  const form = useForm({
    resolver: zodResolver(paymentInputSchema),
    defaultValues: { amount: 0, method: "PIX" as PaymentMethod, notes: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: payment ? payment.amount : balanceDue,
        method: payment ? payment.method : "PIX",
        notes: payment?.notes ?? "",
      });
    }
  }, [open, balanceDue, payment, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? isReceive
                ? "Editar recebimento"
                : "Editar pagamento"
              : isReceive
                ? "Registrar recebimento"
                : "Registrar pagamento"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ajuste o valor, a forma ou a data deste lançamento."
              : `Saldo em aberto: ${formatCurrency(balanceDue)}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          id="payment-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              if (isEdit && payment) {
                if (isReceive) {
                  await updateEvent.mutateAsync({ paymentId: payment.id, input: values });
                } else {
                  await updatePurchase.mutateAsync({ paymentId: payment.id, input: values });
                }
                toast.success("Lançamento atualizado.");
              } else if (isReceive) {
                await receive.mutateAsync({ eventId: targetId, input: values });
                toast.success("Recebimento registrado.");
              } else {
                await pay.mutateAsync({ purchaseId: targetId, input: values });
                toast.success("Pagamento registrado.");
              }
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao registrar.",
              );
            }
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor" htmlFor="pay-amount" required error={form.formState.errors.amount?.message}>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput
                    id="pay-amount"
                    autoFocus
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Forma">
              <Controller
                control={form.control}
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>
          <Field label="Observação" htmlFor="pay-notes" optional>
            <Input id="pay-notes" {...form.register("notes")} />
          </Field>

          {!isReceive && payeePixKey ? (
            <div className="rounded-lg border border-primary/15 bg-secondary/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
                Chave Pix do fornecedor
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="min-w-0 flex-1 break-all text-sm font-medium">
                  {payeePixKey}
                </span>
                <button
                  type="button"
                  onClick={copyPix}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copiada!" : "Copiar chave Pix"}
                </button>
              </div>
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="payment-form"
            loading={form.formState.isSubmitting}
          >
            {isEdit ? "Salvar" : isReceive ? "Receber" : "Pagar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
