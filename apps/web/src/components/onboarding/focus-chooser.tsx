"use client";

import { Boxes, Flower2, Store, type LucideIcon } from "lucide-react";
import type { BusinessFocus } from "@/lib/onboarding/focus";
import { cn } from "@/lib/utils";

interface Option {
  focus: BusinessFocus;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const OPTIONS: Option[] = [
  {
    focus: "RETAIL",
    icon: Flower2,
    title: "Vendo ao cliente",
    desc: "Buquês e arranjos direto ao consumidor",
  },
  {
    focus: "WHOLESALE",
    icon: Boxes,
    title: "Revendo no atacado",
    desc: "Vendo insumo em pacote a outros lojistas",
  },
  {
    focus: "BOTH",
    icon: Store,
    title: "Os dois",
    desc: "Varejo e atacado juntos",
  },
];

/**
 * Escolha de como o lojista vende — personaliza o passo a passo. Reutilizado no
 * welcome, no checklist do Início e no guia "Como começar".
 */
export function FocusChooser({
  value,
  onChoose,
  className,
}: {
  value?: BusinessFocus | null;
  onChoose: (focus: BusinessFocus) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.focus;
        return (
          <button
            key={opt.focus}
            type="button"
            onClick={() => onChoose(opt.focus)}
            className={cn(
              "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors",
              active
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground/70",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">{opt.title}</span>
            <span className="text-xs text-muted-foreground">{opt.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
