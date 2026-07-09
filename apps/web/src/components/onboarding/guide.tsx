"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarHeart,
  CreditCard,
  FileText,
  Package,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface GuideStep {
  icon: LucideIcon;
  title: string;
  text: string;
  /** Exemplo concreto do dia a dia — o que tira o ar "genérico". */
  example: string;
  href: string;
  cta: string;
}

/** Passo a passo do "como funciona" — cada área com um exemplo real. */
const STEPS: GuideStep[] = [
  {
    icon: CalendarHeart,
    title: "Vendas",
    text: "Registre cada venda direta ou entrega e acompanhe quanto já foi pago e quanto ainda falta receber.",
    example: "Ex.: “Buquê de rosas — R$ 120” vira venda e entra no caixa na hora.",
    href: "/vendas",
    cta: "Ir para Vendas",
  },
  {
    icon: Users,
    title: "Clientes",
    text: "Cadastre seus clientes uma vez e tenha o histórico de pedidos e as datas importantes de cada um sempre à mão.",
    example: "Ex.: veja que a Dona Marta compra todo mês e o aniversário dela é dia 12.",
    href: "/clientes",
    cta: "Ir para Clientes",
  },
  {
    icon: FileText,
    title: "Orçamentos",
    text: "Monte orçamentos com a sua marca e, quando o cliente aprovar, transforme em venda com um clique.",
    example: "Ex.: orçamento de um casamento aprovado → vira venda com um toque.",
    href: "/orcamentos",
    cta: "Ir para Orçamentos",
  },
  {
    icon: Package,
    title: "Estoque e compras",
    text: "Controle o que tem em estoque e registre as compras dos fornecedores — as entradas e saídas se ajustam sozinhas.",
    example: "Ex.: comprou 50 rosas → o estoque sobe; vendeu um buquê → desce.",
    href: "/estoque",
    cta: "Ir para Estoque",
  },
  {
    icon: Wallet,
    title: "Financeiro",
    text: "Veja tudo que tem a receber e a pagar, o caixa do dia a dia e para onde o dinheiro está indo.",
    example: "Ex.: “a receber esta semana: R$ 1.240” logo na tela inicial.",
    href: "/financeiro",
    cta: "Ir para Financeiro",
  },
  {
    icon: Store,
    title: "Loja online",
    text: "Ative a sua lojinha na internet e receba pedidos já pagos pelo Mercado Pago, direto no sistema.",
    example: "Ex.: o cliente compra pelo celular e o pedido cai aqui, pago.",
    href: "/loja",
    cta: "Ir para Loja online",
  },
  {
    icon: CreditCard,
    title: "Seu plano",
    text: "Acompanhe o período gratuito e faça o upgrade quando precisar de mais — com calma, sem perder nada.",
    example: "Ex.: veja quantos dias grátis faltam e o que cada plano inclui.",
    href: "/plano",
    cta: "Ir para Plano",
  },
];

interface GuideContextValue {
  open: () => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

/** Abre o guia "Como funciona" de qualquer tela (topbar, boas-vindas…). */
export function useGuide(): GuideContextValue {
  const ctx = useContext(GuideContext);
  if (!ctx) throw new Error("useGuide precisa do GuideProvider");
  return ctx;
}

export function GuideProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open: () => setOpen(true) }), []);
  return (
    <GuideContext.Provider value={value}>
      {children}
      <GuideDialog open={open} onOpenChange={setOpen} />
    </GuideContext.Provider>
  );
}

function GuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [[index, dir], setStep] = useState<[number, number]>([0, 0]);

  // Sempre recomeça do início ao reabrir.
  useEffect(() => {
    if (open) setStep([0, 0]);
  }, [open]);

  const go = (next: number) =>
    setStep(([cur]) => [next, next > cur ? 1 : -1]);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const Icon = step.icon;

  const goToArea = () => {
    onOpenChange(false);
    router.push(step.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <div className="relative min-h-[19rem]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05, type: "spring", stiffness: 220 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-[hsl(var(--clay))]/20 text-primary"
                >
                  <Icon className="h-8 w-8" />
                </motion.span>
                <DialogTitle className="font-serif text-2xl">
                  {step.title}
                </DialogTitle>
                <p className="text-[0.95rem] text-muted-foreground">
                  {step.text}
                </p>
                <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-foreground/80">
                  {step.example}
                </p>
              </div>

              <Button variant="outline" className="w-full" onClick={goToArea}>
                {step.cta}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progresso */}
        <div
          className="flex items-center justify-center gap-1.5"
          aria-label={`Passo ${index + 1} de ${STEPS.length}`}
        >
          {STEPS.map((s, i) => (
            <button
              key={s.href}
              type="button"
              aria-label={`Ir ao passo ${i + 1}: ${s.title}`}
              onClick={() => go(i)}
              className="py-1"
            >
              <motion.span
                className="block h-1.5 rounded-full bg-border"
                animate={{
                  width: i === index ? 20 : 6,
                  backgroundColor:
                    i === index
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                }}
                transition={{ duration: 0.25 }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            {isLast ? "Fechar" : "Pular"}
          </Button>
          <div className="flex gap-2">
            {index > 0 ? (
              <Button variant="outline" onClick={() => go(index - 1)}>
                Anterior
              </Button>
            ) : null}
            <Button
              onClick={() => (isLast ? onOpenChange(false) : go(index + 1))}
            >
              {isLast ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
