"use client";

import { customerInputSchema, type Customer } from "@sistema-flores/types";
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
import { useSaveCustomer } from "@/lib/api/customers";
import { maskCpfCnpj, maskPhone, withMask } from "@/lib/masks";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onCreated?: (customer: Customer) => void;
}

const empty = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  document: "",
  address: "",
  notes: "",
};

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onCreated,
}: CustomerDialogProps) {
  const save = useSaveCustomer(customer?.id);
  const form = useForm({
    resolver: zodResolver(customerInputSchema),
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        whatsapp: customer?.whatsapp ?? "",
        email: customer?.email ?? "",
        document: customer?.document ?? "",
        address: customer?.address ?? "",
        notes: customer?.notes ?? "",
      });
    }
  }, [open, customer, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            Dados de contato e observações do cliente.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const saved = await save.mutateAsync(values);
              toast.success(customer ? "Cliente atualizado." : "Cliente criado.");
              if (!customer) onCreated?.(saved);
              onOpenChange(false);
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Field label="Nome" htmlFor="c-name" required error={form.formState.errors.name?.message}>
            <Input id="c-name" autoFocus {...form.register("name")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" htmlFor="c-phone" optional>
              <Input
                id="c-phone"
                inputMode="numeric"
                placeholder="(11) 91234-5678"
                {...withMask(maskPhone, form.register("phone"))}
              />
            </Field>
            <Field label="WhatsApp" htmlFor="c-whatsapp" optional>
              <Input
                id="c-whatsapp"
                inputMode="numeric"
                placeholder="(11) 91234-5678"
                {...withMask(maskPhone, form.register("whatsapp"))}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail" htmlFor="c-email" optional error={form.formState.errors.email?.message}>
              <Input id="c-email" type="email" {...form.register("email")} />
            </Field>
            <Field label="CPF / CNPJ" htmlFor="c-doc" optional>
              <Input
                id="c-doc"
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...withMask(maskCpfCnpj, form.register("document"))}
              />
            </Field>
          </div>

          <Field label="Endereço de entrega" htmlFor="c-address" optional>
            <Input id="c-address" {...form.register("address")} />
          </Field>

          <Field label="Observações" htmlFor="c-notes" optional>
            <Textarea id="c-notes" rows={3} {...form.register("notes")} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {customer ? "Salvar" : "Criar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
