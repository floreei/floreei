"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useGuide } from "@/components/onboarding/guide";
import { WelcomeVideo } from "@/components/onboarding/welcome-video";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";

const PERKS = [
  "Vendas, orçamentos e caixa do dia a dia",
  "Sua loja online para vender pela internet",
  "Estoque, buquês e financeiro sob controle",
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

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/**
 * Boas-vindas na primeira entrada de quem está no período gratuito: vídeo (ou
 * capa animada da marca), saudação calorosa e o prazo do trial bem claro.
 * Aparece uma vez por empresa e some depois que o cliente assina.
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
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <WelcomeVideo />

        <motion.div
          className="space-y-5 p-6"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
        >
          <motion.div variants={fadeUp} className="space-y-1.5 text-center">
            <DialogTitle className="font-serif text-2xl">
              {firstName
                ? `Bem-vindo(a), ${firstName}!`
                : "Bem-vindo(a) ao Floreei!"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Que bom ter você aqui. Em poucos minutos sua floricultura fica
              organizada — do orçamento à entrega, sem papel espalhado.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Você tem{" "}
              <span className="font-semibold text-foreground">
                {days} {days === 1 ? "dia" : "dias"} grátis
              </span>
              , com tudo liberado.
            </p>
            {access.trialEndsAt ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Vale até{" "}
                <span className="font-semibold text-foreground">
                  {longDate(access.trialEndsAt)}
                </span>
                .
              </p>
            ) : null}
          </motion.div>

          <motion.ul variants={fadeUp} className="space-y-2 text-sm">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp} className="space-y-2">
            <Button
              className="w-full"
              onClick={() => {
                dismiss();
                guide.open();
              }}
            >
              Ver como funciona
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full" onClick={dismiss}>
              Explorar sozinho
            </Button>
            <p className="pt-1 text-center text-xs text-muted-foreground">
              Sem cartão agora. Seus dados ficam guardados quando você assinar.
            </p>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
