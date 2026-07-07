"use client";

import { Check, Flower2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useGuide } from "@/components/onboarding/guide";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";

const PERKS = [
  "Vendas, orçamentos, estoque e financeiro",
  "Sua loja online para vender pela internet",
  "Buquês com custo e margem calculados",
];

/** Chave de "já vi as boas-vindas", por empresa (não repete a cada login). */
function seenKey(companyId: string): string {
  return `floreei:welcomed:${companyId}`;
}

/** Data por extenso: "14 de julho de 2026". */
function longDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Boas-vindas na primeira entrada de quem está no período gratuito: dá um
 * oi caloroso e deixa claro até quando o trial vale. Aparece uma vez por
 * empresa (guardado no navegador) e some depois que o cliente assina.
 */
export function WelcomeDialog() {
  const { user } = useAuth();
  const guide = useGuide();
  const [open, setOpen] = useState(false);

  const access = user?.access;
  const companyId = user?.companyId;

  useEffect(() => {
    if (!companyId || access?.status !== "TRIAL") return;
    if (localStorage.getItem(seenKey(companyId))) return;
    setOpen(true);
  }, [companyId, access?.status]);

  const dismiss = () => {
    if (companyId) localStorage.setItem(seenKey(companyId), "1");
    setOpen(false);
  };

  if (!user || access?.status !== "TRIAL") return null;

  const firstName = user.name?.split(" ")[0];
  const days = access.trialDaysLeft ?? 7;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Flower2 className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center font-serif text-2xl">
            {firstName ? `Bem-vindo(a), ${firstName}!` : "Bem-vindo(a) ao Floreei!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Que bom ter você aqui. A partir de agora, sua floricultura fica
            organizada num lugar só — do orçamento à entrega.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Você tem{" "}
              <span className="font-semibold text-foreground">
                {days} {days === 1 ? "dia" : "dias"} grátis
              </span>
              , com tudo liberado.
            </p>
            {access.trialEndsAt ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Seu período gratuito vai até{" "}
                <span className="font-semibold text-foreground">
                  {longDate(access.trialEndsAt)}
                </span>
                .
              </p>
            ) : null}
          </div>

          <ul className="space-y-2 text-sm">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {perk}
              </li>
            ))}
          </ul>

          <p className="text-center text-xs text-muted-foreground">
            Sem cartão agora. Quando o período acabar, você escolhe um plano com
            calma — seus dados ficam guardados.
          </p>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => {
              dismiss();
              guide.open();
            }}
          >
            Ver como funciona
          </Button>
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            Explorar sozinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
