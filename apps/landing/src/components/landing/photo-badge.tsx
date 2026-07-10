"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Cada selo tem DUAS camadas: um `div` estático (`position: absolute`,
 * ancorado no canto da foto pela `className` de quem chama — pode incluir
 * `-translate-y-1/2` pra centralizar) e, dentro, um `motion.div` só com o
 * visual + animação. Não dá pra por a animação no MESMO elemento que tem o
 * `-translate-y-1/2`: o Motion escreve `transform` inline, que teria
 * prioridade sobre a classe do Tailwind e cancelaria a centralização. E não
 * dá pra por a animação num wrapper VAZIO por fora do selo: um wrapper sem
 * conteúdo em fluxo normal (o selo, se já fosse `absolute`, não entra no
 * cálculo do tamanho do pai) colapsa pra largura/altura zero, e a origem do
 * scale cai num ponto qualquer — nesta página já vimos cair embaixo da
 * foto, porque é onde o wrapper ficava no fluxo (logo depois da <img>).
 * Com o motion.div em fluxo normal DENTRO do wrapper estático, ele tem
 * tamanho real e a origem do scale é sempre o próprio card.
 */
function useBadgeMotion({
  delay,
  float,
  floatDelay = 0,
}: {
  delay: number;
  float?: boolean;
  floatDelay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return { initial: false as const };

  return {
    initial: { opacity: 0, scale: 0.88, x: 0, y: 0 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: false, amount: 0.3, margin: "-60px" },
    // x/y (float) e scale/opacity (entrada) são chaves diferentes — o Motion
    // compõe as duas num único transform, sem conflito.
    animate: float ? { x: [0, 3, 0], y: [0, -9, 0] } : undefined,
    transition: {
      default: { type: "spring" as const, bounce: 0.15, duration: 0.4, delay: delay / 1000 },
      ...(float
        ? {
            x: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: floatDelay },
            y: { duration: 5, repeat: Infinity, ease: "easeInOut" as const, delay: floatDelay },
          }
        : {}),
    },
  };
}

interface BadgeMotionProps {
  delay?: number;
  float?: boolean;
  floatDelay?: number;
}

/** Selo flutuante sobre foto: ícone + texto, cartão branco. */
export function PhotoBadge({
  icon,
  title,
  subtitle,
  className,
  delay = 0,
  float,
  floatDelay,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
} & BadgeMotionProps) {
  const motionProps = useBadgeMotion({ delay, float, floatDelay });
  return (
    <div className={cn("absolute z-10", className)}>
      <motion.div
        {...motionProps}
        className="flex max-w-[15rem] items-center gap-2.5 rounded-lg border border-border/70 bg-card px-3.5 py-2.5 text-card-foreground shadow-lg"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-card-foreground">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

/** Selo flutuante compacto sobre foto: rótulo pequeno + valor em destaque. */
export function MiniStat({
  label,
  value,
  className,
  delay = 0,
  float,
  floatDelay,
}: {
  label: string;
  value: string;
  className?: string;
} & BadgeMotionProps) {
  const motionProps = useBadgeMotion({ delay, float, floatDelay });
  return (
    <div className={cn("absolute z-10", className)}>
      <motion.div
        {...motionProps}
        className="whitespace-nowrap rounded-lg border border-border/70 bg-card px-3.5 py-2.5 text-card-foreground shadow-lg"
      >
        <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
        <p className="sf-serif mt-0.5 text-lg font-semibold leading-none tabular-nums">
          {value}
        </p>
      </motion.div>
    </div>
  );
}

/** Selo flutuante de estatística sobre foto: cartão colorido com número grande. */
export function StatBadge({
  value,
  label,
  className,
  delay = 0,
  float,
  floatDelay,
}: {
  value: string;
  label: string;
  className?: string;
} & BadgeMotionProps) {
  const motionProps = useBadgeMotion({ delay, float, floatDelay });
  return (
    <div className={cn("absolute z-10", className)}>
      <motion.div
        {...motionProps}
        className="rounded-xl bg-clay px-4 py-3 text-clay-foreground shadow-lg"
      >
        <p className="sf-serif text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs leading-tight text-clay-foreground/85">
          {label}
        </p>
      </motion.div>
    </div>
  );
}
