"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Faixa fixa no topo enquanto há pagamento da assinatura pendente (dentro da
 * carência). Passada a carência, o guard bloqueia e a tela de bloqueio assume.
 */
export function PaymentBanner() {
  const { user } = useAuth();
  const access = user?.access;
  if (!access || access.graceDaysLeft === null) return null;

  const days = access.graceDaysLeft;
  const label =
    days <= 0
      ? "O acesso será bloqueado hoje."
      : `Você tem ${days} ${days === 1 ? "dia" : "dias"} para regularizar.`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
      <span className="inline-flex items-center gap-1.5 font-medium">
        <AlertTriangle className="h-4 w-4" />
        Pagamento da assinatura pendente. {label}
      </span>
      {user?.role === "ADMIN" ? (
        <Button asChild size="sm" variant="destructive" className="h-7 px-3">
          <Link href="/plano">Regularizar</Link>
        </Button>
      ) : (
        <span className="text-foreground/70">
          Avise o administrador da sua empresa.
        </span>
      )}
    </div>
  );
}
