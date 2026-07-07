"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

/**
 * Faixa fixa no topo enquanto a empresa está no período gratuito. Fica discreta
 * no começo e vermelha/urgente nos últimos dias — convidando a assinar antes de
 * o acesso ser bloqueado. Some quando o plano é ACTIVE (assinante).
 */
export function TrialBanner() {
  const { user } = useAuth();
  const access = user?.access;
  if (!access || access.status !== "TRIAL") return null;

  const days = access.trialDaysLeft ?? 0;
  const urgent = days <= 3;

  const label =
    days <= 0
      ? "Seu período gratuito termina hoje."
      : `Período gratuito: ${days} ${days === 1 ? "dia restante" : "dias restantes"}.`;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-b px-4 py-2 text-sm",
        urgent
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-warning/20 bg-warning/10 text-warning",
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <Clock className="h-4 w-4" />
        {label}
      </span>
      <span className="text-foreground/70">
        Assine para continuar usando o sistema.
      </span>
      <Button
        asChild
        size="sm"
        variant={urgent ? "destructive" : "default"}
        className="h-7 px-3"
      >
        <Link href="/plano">Assinar</Link>
      </Button>
    </div>
  );
}
