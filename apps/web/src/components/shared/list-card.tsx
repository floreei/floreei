"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ListCardProps {
  /** Linha principal (nome do cliente, descrição da venda…). */
  title: React.ReactNode;
  /** Linha secundária (contato, data…). */
  subtitle?: React.ReactNode;
  /** Canto direito, linha de cima (valor, badge de status…). */
  meta?: React.ReactNode;
  /** Canto direito, linha de baixo (complemento pequeno). */
  metaSub?: React.ReactNode;
  /** Avatar/ícone à esquerda (opcional). */
  leading?: React.ReactNode;
  /** Vira <Link>; senão, botão com onClick. */
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Linha de lista tocável para o celular (as tabelas ficam no desktop):
 * título forte, apoio embaixo, valor à direita, chevron. Alvo ≥64px.
 */
export function ListCard({
  title,
  subtitle,
  meta,
  metaSub,
  leading,
  href,
  onClick,
  className,
}: ListCardProps) {
  const body = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium leading-snug">{title}</div>
        {subtitle ? (
          <div className="truncate text-sm text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
      {meta !== undefined || metaSub !== undefined ? (
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {meta !== undefined ? (
            <div className="whitespace-nowrap font-semibold tabular-nums leading-snug">
              {meta}
            </div>
          ) : null}
          {metaSub !== undefined ? (
            <div className="whitespace-nowrap text-xs text-muted-foreground">
              {metaSub}
            </div>
          ) : null}
        </div>
      ) : null}
      {href || onClick ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
      ) : null}
    </>
  );

  const classes = cn(
    "flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-xs transition-colors",
    (href || onClick) && "active:bg-muted/60",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}
