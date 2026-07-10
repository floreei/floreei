"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A entrada ("pop") vive NO PRÓPRIO selo, não num wrapper externo — um selo
 * é `position: absolute` (ancorado num canto da foto) e, se a animação
 * ficasse num `motion.div` envolvendo ele, esse wrapper (sem tamanho
 * próprio, já que o filho absoluto não contribui pro seu shrink-to-fit)
 * vira a origem do scale, quase sempre num ponto errado (ex.: embaixo da
 * foto, onde o wrapper cai no fluxo normal). Aqui a origem do scale é
 * sempre o próprio card, no lugar certo.
 */
function usePopMotion(delay: number) {
  const reduced = useReducedMotion();
  if (reduced) {
    return { initial: false as const, whileInView: undefined, viewport: undefined, transition: undefined };
  }
  return {
    initial: { opacity: 0, scale: 0.88 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: false, amount: 0.3, margin: "-60px" },
    transition: { type: "spring" as const, bounce: 0.15, duration: 0.4, delay: delay / 1000 },
  };
}

/** Selo flutuante sobre foto: ícone + texto, cartão branco. */
export function PhotoBadge({
  icon,
  title,
  subtitle,
  className,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
  delay?: number;
}) {
  const motionProps = usePopMotion(delay);
  return (
    <motion.div
      {...motionProps}
      className={cn(
        "absolute z-10 flex max-w-[15rem] items-center gap-2.5 rounded-lg border border-border/70 bg-card px-3.5 py-2.5 text-card-foreground shadow-lg",
        className,
      )}
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
  );
}

/** Selo flutuante compacto sobre foto: rótulo pequeno + valor em destaque. */
export function MiniStat({
  label,
  value,
  className,
  delay = 0,
}: {
  label: string;
  value: string;
  className?: string;
  delay?: number;
}) {
  const motionProps = usePopMotion(delay);
  return (
    <motion.div
      {...motionProps}
      className={cn(
        "absolute z-10 whitespace-nowrap rounded-lg border border-border/70 bg-card px-3.5 py-2.5 text-card-foreground shadow-lg",
        className,
      )}
    >
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
      <p className="sf-serif mt-0.5 text-lg font-semibold leading-none tabular-nums">
        {value}
      </p>
    </motion.div>
  );
}

/** Selo flutuante de estatística sobre foto: cartão colorido com número grande. */
export function StatBadge({
  value,
  label,
  className,
  delay = 0,
}: {
  value: string;
  label: string;
  className?: string;
  delay?: number;
}) {
  const motionProps = usePopMotion(delay);
  return (
    <motion.div
      {...motionProps}
      className={cn(
        "absolute z-10 rounded-xl bg-clay px-4 py-3 text-clay-foreground shadow-lg",
        className,
      )}
    >
      <p className="sf-serif text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1 text-xs leading-tight text-clay-foreground/85">
        {label}
      </p>
    </motion.div>
  );
}
