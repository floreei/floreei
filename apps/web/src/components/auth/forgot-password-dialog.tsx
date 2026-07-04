"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";

const schema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("E-mail inválido"),
});
type Values = z.infer<typeof schema>;

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** E-mail já digitado no login, para pré-preencher. */
  defaultEmail?: string;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  defaultEmail = "",
}: ForgotPasswordDialogProps) {
  const { resetPassword } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
  });

  // Ao abrir: pré-preenche com o e-mail do login e limpa o estado anterior.
  useEffect(() => {
    if (open) {
      form.reset({ email: defaultEmail });
      setSentTo(null);
    }
  }, [open, defaultEmail, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {sentTo ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" />
            </span>
            <div className="space-y-1.5">
              <DialogTitle>Verifique seu e-mail</DialogTitle>
              <DialogDescription>
                Se houver uma conta com{" "}
                <span className="font-medium text-foreground">{sentTo}</span>,
                enviamos um link para você criar uma nova senha. Se não achar,
                olhe na caixa de spam.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button className="w-full">Entendi</Button>
            </DialogClose>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Redefinir senha</DialogTitle>
              <DialogDescription>
                Informe o e-mail da sua conta e enviaremos um link para criar
                uma nova senha.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(async ({ email }) => {
                try {
                  await resetPassword(email);
                  setSentTo(email);
                } catch (error) {
                  form.setError("email", {
                    message:
                      error instanceof Error
                        ? error.message
                        : "Não foi possível enviar o link.",
                  });
                }
              })}
            >
              <Field
                label="E-mail"
                htmlFor="forgot-email"
                required
                error={form.formState.errors.email?.message}
              >
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="voce@floricultura.com"
                  autoComplete="email"
                  autoFocus
                  {...form.register("email")}
                />
              </Field>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  Enviar link
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
