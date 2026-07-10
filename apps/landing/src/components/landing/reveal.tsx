"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "right" | "scale" | "pop";

const VARIANTS: Record<RevealVariant, Variants> = {
  up: {
    hidden: { opacity: 0, y: 34 },
    show: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -36 },
    show: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: 36 },
    show: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94, y: 14 },
    show: { opacity: 1, scale: 1, y: 0 },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.88 },
    show: { opacity: 1, scale: 1 },
  },
};

/**
 * Revela o conteúdo ao entrar na viewport e volta ao estado inicial ao sair
 * (`viewport.once: false`) — anima tanto na rolagem de descida quanto na de
 * subida, para a página nunca parecer "parada". Respeita
 * prefers-reduced-motion (sem transformação, só aparece).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  /** Atraso em ms (mesma unidade usada nos call sites existentes). */
  delay?: number;
  variant?: RevealVariant;
  /** Fração do elemento visível para disparar (0–1). */
  amount?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount, margin: "-60px" }}
      variants={VARIANTS[variant]}
      transition={{
        duration: variant === "pop" ? 0.4 : 0.65,
        delay: delay / 1000,
        ease: variant === "pop" ? undefined : [0.16, 1, 0.3, 1],
        type: variant === "pop" ? "spring" : undefined,
        bounce: variant === "pop" ? 0.15 : undefined,
      }}
    >
      {children}
    </motion.div>
  );
}
