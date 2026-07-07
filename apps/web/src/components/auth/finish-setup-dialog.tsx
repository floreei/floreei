"use client";

import { provisionSchema } from "@sistema-flores/types";
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
import type { PendingProvision } from "@/lib/auth/auth-context";
import { useAuth } from "@/lib/auth/auth-context";
import { maskCpfCnpj, withMask } from "@/lib/masks";

interface FinishSetupDialogProps {
  pending: PendingProvision | null;
  /** Fechar sem concluir = sair da conta do Firebase. */
  onCancel: () => void;
}

/**
 * Passo final para quem entrou por login social e ainda não tem empresa: pede o
 * nome da floricultura (o nome vem do Google, editável) e provisiona a conta.
 */
export function FinishSetupDialog({
  pending,
  onCancel,
}: FinishSetupDialogProps) {
  const { provisionCompany } = useAuth();
  const form = useForm({
    resolver: zodResolver(provisionSchema),
    defaultValues: { companyName: "", name: "", document: "" },
  });

  useEffect(() => {
    if (pending) form.reset({ companyName: "", name: pending.name, document: "" });
  }, [pending, form]);

  return (
    <Dialog open={pending != null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Falta só um passo</DialogTitle>
          <DialogDescription>
            {pending?.email ? `Você entrou como ${pending.email}. ` : ""}
            Conte o nome da sua floricultura para criarmos o seu espaço.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit(async ({ companyName, name, document }) => {
            try {
              await provisionCompany(companyName, name, document);
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Não foi possível concluir o cadastro.",
              );
            }
          })}
        >
          <Field
            label="Nome da empresa"
            htmlFor="setup-company"
            required
            error={form.formState.errors.companyName?.message}
          >
            <Input
              id="setup-company"
              autoFocus
              placeholder="Floricultura Bela Flor"
              {...form.register("companyName")}
            />
          </Field>

          <Field
            label="Seu nome"
            htmlFor="setup-name"
            required
            error={form.formState.errors.name?.message}
          >
            <Input
              id="setup-name"
              placeholder="Ana Souza"
              {...form.register("name")}
            />
          </Field>

          <Field
            label="CNPJ ou CPF"
            htmlFor="setup-document"
            required
            error={form.formState.errors.document?.message}
            hint="Um cadastro por negócio."
          >
            <Input
              id="setup-document"
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              {...withMask(maskCpfCnpj, form.register("document"))}
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Criar meu espaço
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
