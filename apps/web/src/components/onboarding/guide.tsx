"use client";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface GuideStep {
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
  cta: string;
}

/** Passo a passo do "como funciona" — explica cada área em linguagem simples. */
const STEPS: GuideStep[] = [
  {
    icon: CalendarHeart,
    title: "Vendas",
    text: "Registre cada venda de balcão ou entrega e acompanhe quanto já foi pago e quanto ainda falta receber.",
    href: "/eventos",
    cta: "Ir para Vendas",
  },
  {
    icon: Users,
    title: "Clientes",
    text: "Cadastre seus clientes uma vez e tenha o histórico de pedidos e as datas importantes de cada um sempre à mão.",
    href: "/clientes",
    cta: "Ir para Clientes",
  },
  {
    icon: FileText,
    title: "Orçamentos",
    text: "Monte orçamentos com a sua marca e, quando o cliente aprovar, transforme em venda com um clique.",
    href: "/orcamentos",
    cta: "Ir para Orçamentos",
  },
  {
    icon: Package,
    title: "Estoque e compras",
    text: "Controle o que tem em estoque e registre as compras dos fornecedores — as entradas e saídas se ajustam sozinhas.",
    href: "/estoque",
    cta: "Ir para Estoque",
  },
  {
    icon: Wallet,
    title: "Financeiro",
    text: "Veja tudo que tem a receber e a pagar, o caixa do dia a dia e para onde o dinheiro está indo.",
    href: "/financeiro",
    cta: "Ir para Financeiro",
  },
  {
    icon: Store,
    title: "Loja online",
    text: "Ative a sua lojinha na internet e receba pedidos já pagos pelo Mercado Pago, direto no sistema.",
    href: "/loja",
    cta: "Ir para Loja online",
  },
  {
    icon: CreditCard,
    title: "Seu plano",
    text: "Acompanhe o período gratuito e faça o upgrade quando precisar de mais — com calma, sem perder nada.",
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
  const [index, setIndex] = useState(0);

  // Sempre recomeça do início ao reabrir.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const Icon = step.icon;

  const goToArea = () => {
    onOpenChange(false);
    router.push(step.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center font-serif text-2xl">
            {step.title}
          </DialogTitle>
          <DialogDescription className="text-center text-[0.95rem]">
            {step.text}
          </DialogDescription>
        </DialogHeader>

        <Button variant="outline" className="w-full" onClick={goToArea}>
          {step.cta}
          <ArrowRight className="h-4 w-4" />
        </Button>

        {/* Progresso */}
        <div
          className="flex items-center justify-center gap-1.5"
          aria-label={`Passo ${index + 1} de ${STEPS.length}`}
        >
          {STEPS.map((s, i) => (
            <span
              key={s.href}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-primary" : "w-1.5 bg-border",
              )}
            />
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
              <Button variant="outline" onClick={() => setIndex((i) => i - 1)}>
                Anterior
              </Button>
            ) : null}
            <Button
              onClick={() =>
                isLast ? onOpenChange(false) : setIndex((i) => i + 1)
              }
            >
              {isLast ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
