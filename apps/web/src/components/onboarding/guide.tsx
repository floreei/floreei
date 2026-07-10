"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Boxes,
  CalendarHeart,
  Flower,
  Sprout,
  Truck,
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
import { FocusChooser } from "@/components/onboarding/focus-chooser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { type BusinessFocus, getFocus, setFocus } from "@/lib/onboarding/focus";

interface GuideStep {
  icon: LucideIcon;
  title: string;
  text: string;
  /** Exemplo concreto do dia a dia — o que tira o ar "genérico". */
  example: string;
  href: string;
  cta: string;
}

const BASE: GuideStep = {
  icon: Sprout,
  title: "A base: categorias e insumos",
  text: "Tudo começa aqui. Crie categorias (Flores, Laços, Doces) e cadastre seus insumos — o que você compra e vende.",
  example: 'Ex.: categoria "Rosas" → insumo "Rosa Vermelha", R$ 4 o maço.',
  href: "/insumos",
  cta: "Cadastrar insumos",
};

const RETAIL: GuideStep[] = [
  {
    icon: Flower,
    title: "Monte seus buquês",
    text: "Junte insumos numa ficha técnica. O custo vem dos insumos e o preço sai automático pela margem que você definir.",
    example: 'Ex.: 12 rosas + papel + laço = "Buquê Encanto".',
    href: "/buques",
    cta: "Montar um buquê",
  },
  {
    icon: CalendarHeart,
    title: "Faça a venda direta",
    text: "Venda o buquê (ou um insumo avulso) ao cliente e receba na hora ou fiado.",
    example: 'Ex.: "Buquê Encanto — R$ 120" vira venda e entra no caixa.',
    href: "/vendas",
    cta: "Ir para Vendas",
  },
];

const WHOLESALE: GuideStep[] = [
  {
    icon: Truck,
    title: "Compre do fornecedor",
    text: "Cadastre o fornecedor e registre a compra. O estoque sobe e o custo dos insumos se atualiza sozinho.",
    example: "Ex.: comprou 50 maços de rosas da Ceasa → estoque e custo prontos.",
    href: "/fornecedores",
    cta: "Cadastrar fornecedor",
  },
  {
    icon: Boxes,
    title: "Venda no atacado",
    text: "Revenda o maço fechado a outro lojista, com o preço de atacado.",
    example: "Ex.: revende 20 maços de rosas para outra floricultura.",
    href: "/atacado",
    cta: "Ir para Atacado",
  },
];

const FINANCE: GuideStep = {
  icon: Wallet,
  title: "Acompanhe o dinheiro",
  text: "Veja o que tem a receber, a pagar e o caixa do dia a dia — tudo num lugar só.",
  example: 'Ex.: "a receber esta semana: R$ 1.240" logo na tela inicial.',
  href: "/financeiro",
  cta: "Ir para Financeiro",
};

/** Passos na ordem certa, conforme o lojista vende. */
function buildSteps(focus: BusinessFocus): GuideStep[] {
  const middle =
    focus === "RETAIL"
      ? RETAIL
      : focus === "WHOLESALE"
        ? WHOLESALE
        : [...RETAIL, ...WHOLESALE];
  return [BASE, ...middle, FINANCE];
}

interface GuideContextValue {
  open: () => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

/** Abre o guia "Como começar" de qualquer tela (topbar, boas-vindas…). */
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
  const { user } = useAuth();
  const companyId = user?.companyId;
  // Relê o foco do localStorage a cada abertura (pode ter sido escolhido no
  // checklist/boas-vindas — instâncias separadas não compartilham estado).
  const [focus, setFocusState] = useState<BusinessFocus | null>(null);
  const [[index, dir], setStep] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (!open) return;
    setStep([0, 0]);
    setFocusState(companyId ? getFocus(companyId) : null);
  }, [open, companyId]);

  const choose = (f: BusinessFocus) => {
    if (companyId) setFocus(companyId, f);
    setFocusState(f);
  };

  // Sem foco escolhido: pergunta primeiro (personaliza o passo a passo).
  if (open && !focus) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="space-y-4 text-center">
            <DialogTitle className="font-serif text-2xl">
              Como você vende?
            </DialogTitle>
            <p className="text-[0.95rem] text-muted-foreground">
              Escolha para receber um passo a passo sob medida.
            </p>
            <FocusChooser
              className="sm:grid-cols-1"
              onChoose={(f) => {
                choose(f);
                setStep([0, 0]);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const steps = buildSteps(focus ?? "BOTH");
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;
  const Icon = step.icon;

  const go = (next: number) => setStep(([cur]) => [next, next > cur ? 1 : -1]);

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
          aria-label={`Passo ${index + 1} de ${steps.length}`}
        >
          {steps.map((s, i) => (
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
