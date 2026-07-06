"use client";

import { Clock, Flower2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlockedAccess } from "@/lib/auth/auth-context";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Tela exibida quando a empresa está autenticada mas sem acesso liberado:
 * período gratuito encerrado ou conta suspensa. Convida a falar com o suporte.
 */
export function AccessBlocked({ blocked }: { blocked: BlockedAccess }) {
  const { logout } = useAuth();
  const suspended = blocked.code === "COMPANY_SUSPENDED";
  const Icon = suspended ? Lock : Clock;

  const title = suspended
    ? "Acesso suspenso"
    : "Seu período gratuito terminou";
  const description = suspended
    ? "O acesso da sua empresa está temporariamente suspenso. Fale com a gente para reativar."
    : "Para continuar usando o Floreei, assine um plano. Fale com a gente e liberamos seu acesso na hora.";
  const cta = suspended ? "Falar com a gente" : "Assinar agora";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <a
              href="https://wa.me/?text=Quero%20continuar%20usando%20o%20Floreei"
              target="_blank"
              rel="noreferrer"
            >
              {cta}
            </a>
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => logout()}>
            Sair
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
