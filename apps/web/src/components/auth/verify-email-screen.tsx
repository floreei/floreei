"use client";

import { Flower2, MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Autenticado no Firebase, mas com e-mail não verificado. Sem verificar, o
 * cadastro não é provisionado e o acesso é bloqueado (impede usar/registrar
 * empresa com e-mail de outra pessoa). Login com Google já vem verificado.
 */
export function VerifyEmailScreen({ email }: { email: string }) {
  const { resendVerification, confirmVerification, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirmVerification();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível confirmar.",
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      toast.success("Enviamos o e-mail de novo. Confira sua caixa de entrada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível reenviar.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-semibold">
            Verifique seu e-mail
          </h1>
          <p className="text-sm text-muted-foreground">
            Enviamos um link de confirmação para{" "}
            <span className="font-medium text-foreground">{email}</span>. Clique
            nele e volte aqui para continuar.
          </p>
        </div>
        <div className="space-y-3">
          <Button className="w-full" loading={confirming} onClick={handleConfirm}>
            Já confirmei
          </Button>
          <Button
            variant="outline"
            className="w-full"
            loading={resending}
            onClick={handleResend}
          >
            Reenviar e-mail
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => logout()}>
            Usar outra conta
          </Button>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Flower2 className="h-3.5 w-3.5" />
          Floreei
        </p>
      </div>
    </div>
  );
}
