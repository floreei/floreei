"use client";

import { convertQuoteSchema, type Quote } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useConvertQuote } from "@/lib/api/events";

export function ConvertDialog({
  open,
  onOpenChange,
  quote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}) {
  const convert = useConvertQuote();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(convertQuoteSchema),
    defaultValues: { title: "", date: "", location: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: quote.customer ? `Evento — ${quote.customer.name}` : "Novo evento",
        date: "",
        location: "",
      });
    }
  }, [open, quote, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Converter em evento</DialogTitle>
          <DialogDescription>
            O orçamento será aprovado e um evento confirmado será criado com os
            valores atuais.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const event = await convert.mutateAsync({
                quoteId: quote.id,
                input: values,
              });
              toast.success("Evento criado!");
              onOpenChange(false);
              router.push(`/eventos/${event.id}`);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao converter.",
              );
            }
          })}
        >
          <Field label="Título do evento" htmlFor="ev-title" required error={form.formState.errors.title?.message}>
            <Input id="ev-title" autoFocus {...form.register("title")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" htmlFor="ev-date" required error={form.formState.errors.date?.message}>
              <Input id="ev-date" type="date" {...form.register("date")} />
            </Field>
            <Field label="Local" htmlFor="ev-location" optional>
              <Input id="ev-location" {...form.register("location")} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Confirmar evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
