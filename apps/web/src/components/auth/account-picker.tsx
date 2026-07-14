"use client";

import type { AccountOption } from "@sistema-flores/types";
import { Building2, ChevronRight, Flower2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

/**
 * Seletor de conta do login multi-conta: o e-mail pertence a mais de uma
 * empresa, então o usuário escolhe em qual entrar.
 */
export function AccountPicker({
  accounts,
  onSelect,
  onCancel,
}: {
  accounts: AccountOption[];
  onSelect: (companyId: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pick = async (companyId: string) => {
    setLoadingId(companyId);
    try {
      await onSelect(companyId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível entrar.",
      );
      setLoadingId(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flower2 className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold">Escolha a conta</h1>
          <p className="text-sm text-muted-foreground">
            Seu e-mail tem acesso a mais de uma empresa. Em qual você quer
            entrar?
          </p>
        </div>

        <div className="space-y-2">
          {accounts.map((a) => (
            <button
              key={a.companyId}
              type="button"
              disabled={loadingId !== null}
              onClick={() => pick(a.companyId)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {a.companyName || "Empresa"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {roleLabels[a.role] ?? a.role}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="text-center">
          <Button variant="link" size="sm" onClick={onCancel}>
            Entrar com outra conta
          </Button>
        </div>
      </div>
    </div>
  );
}
