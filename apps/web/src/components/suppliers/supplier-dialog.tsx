"use client";

import { supplierInputSchema, type Supplier } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { useSaveSupplier } from "@/lib/api/suppliers";
import { maskPhone, withMask } from "@/lib/masks";

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}) {
  const save = useSaveSupplier(supplier?.id);
  const form = useForm({
    resolver: zodResolver(supplierInputSchema),
    defaultValues: {
      name: "",
      city: "",
      contact: "",
      whatsapp: "",
      paymentTerms: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: supplier?.name ?? "",
        city: supplier?.city ?? "",
        contact: supplier?.contact ?? "",
        whatsapp: supplier?.whatsapp ?? "",
        paymentTerms: supplier?.paymentTerms ?? "",
        notes: supplier?.notes ?? "",
      });
    }
  }, [open, supplier, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Editar fornecedor" : "Novo fornecedor"}
          </DialogTitle>
          <DialogDescription>De quem você compra flores e insumos.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save.mutateAsync(values);
              toast.success("Fornecedor salvo.");
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Field label="Nome" htmlFor="s-name" required error={form.formState.errors.name?.message}>
            <Input id="s-name" autoFocus {...form.register("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cidade" htmlFor="s-city" optional>
              <Input id="s-city" {...form.register("city")} />
            </Field>
            <Field label="WhatsApp" htmlFor="s-whats" optional>
              <Input
                id="s-whats"
                inputMode="numeric"
                placeholder="(11) 91234-5678"
                {...withMask(maskPhone, form.register("whatsapp"))}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contato" htmlFor="s-contact" optional>
              <Input id="s-contact" {...form.register("contact")} />
            </Field>
            <Field label="Condições de pagamento" htmlFor="s-terms" optional>
              <Input id="s-terms" placeholder="Ex.: 30 dias" {...form.register("paymentTerms")} />
            </Field>
          </div>
          <Field label="Observações" htmlFor="s-notes" optional>
            <Textarea id="s-notes" rows={2} {...form.register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
