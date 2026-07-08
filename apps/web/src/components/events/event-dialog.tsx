"use client";

import {
  eventInputSchema,
  type Event,
  type EventStatus,
  type EventType,
} from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useCustomers } from "@/lib/api/customers";
import { useSaveEvent } from "@/lib/api/events";
import { useReceiveForEvent } from "@/lib/api/finance";

const statusOptions: Array<[EventStatus, string]> = [
  ["CONFIRMED", "Confirmado"],
  ["IN_PROGRESS", "Em andamento"],
  ["DONE", "Concluído"],
];

const typeOptions: Array<[EventType, string]> = [
  ["ORDER", "Pedido (balcão/entrega)"],
  ["EVENT", "Evento (decoração)"],
];

const CONSUMER = "__consumer__";

export function EventDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
}) {
  const { data: customers } = useCustomers({ pageSize: 100 });
  const save = useSaveEvent(event?.id);
  const receive = useReceiveForEvent();
  const [receivedNow, setReceivedNow] = useState(0);
  const isEdit = Boolean(event);

  const form = useForm({
    resolver: zodResolver(eventInputSchema),
    defaultValues: {
      type: "ORDER" as EventType,
      customerId: undefined as string | undefined,
      title: "",
      date: "",
      location: "",
      status: "CONFIRMED" as EventStatus,
      soldValue: 0,
      receivedValue: 0,
      estimatedProfit: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      setReceivedNow(0);
      form.reset({
        type: event?.type ?? "ORDER",
        customerId: event?.customerId ?? undefined,
        title: event?.title ?? "",
        date: event?.date ?? "",
        location: event?.location ?? "",
        status: event?.status ?? "CONFIRMED",
        soldValue: event?.soldValue ?? 0,
        receivedValue: event?.receivedValue ?? 0,
        estimatedProfit: event?.estimatedProfit ?? 0,
        notes: event?.notes ?? "",
      });
    }
  }, [open, event, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullOnMobile className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar venda" : "Nova venda"}</DialogTitle>
          <DialogDescription>
            Um pedido de balcão/entrega ou um evento de decoração.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const saved = await save.mutateAsync(values);
              if (!isEdit && receivedNow > 0) {
                await receive.mutateAsync({
                  eventId: saved.id,
                  input: { amount: receivedNow, method: "PIX" },
                });
              }
              toast.success(isEdit ? "Venda atualizada." : "Venda registrada.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Field label="Título" htmlFor="e-title" required error={form.formState.errors.title?.message}>
            <Input id="e-title" autoFocus placeholder="Ex.: Buquê de rosas — entrega" {...form.register("title")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Cliente" optional error={form.formState.errors.customerId?.message}>
              <Controller
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? CONSUMER}
                    onValueChange={(v) =>
                      field.onChange(v === CONSUMER ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CONSUMER}>Consumidor (sem cliente)</SelectItem>
                      {customers?.data.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" htmlFor="e-date" required error={form.formState.errors.date?.message}>
              <Input id="e-date" type="date" {...form.register("date")} />
            </Field>
            <Field label="Local / entrega" htmlFor="e-location" optional>
              <Input id="e-location" {...form.register("location")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor da venda" htmlFor="e-sold">
              <Controller
                control={form.control}
                name="soldValue"
                render={({ field }) => (
                  <CurrencyInput
                    id="e-sold"
                    value={field.value ?? 0}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field label="Status">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(([value, label]) => (
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

          {!isEdit ? (
            <Field
              label="Recebido agora"
              htmlFor="e-received-now"
              hint="0 = a prazo (fica a receber). Use “À vista” para o valor total."
            >
              <div className="flex gap-2">
                <CurrencyInput
                  id="e-received-now"
                  value={receivedNow}
                  onChange={setReceivedNow}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReceivedNow(Number(form.getValues("soldValue")) || 0)}
                >
                  À vista
                </Button>
              </div>
            </Field>
          ) : null}

          <Field label="Observações" htmlFor="e-notes" optional>
            <Input id="e-notes" {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {isEdit ? "Salvar" : "Registrar venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
