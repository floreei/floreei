import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Campos focáveis de formulário (para o "próximo" do teclado mobile). */
const FIELD_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';

/**
 * No celular, o Enter/"próximo" do teclado pula para o campo seguinte do
 * formulário (em vez de submeter/fechar). No último campo, deixa o
 * comportamento padrão (submit quando houver) e fecha o teclado — o rodapé
 * fixo reaparece. Desktop não muda (Enter continua submetendo).
 */
function focusNextFieldOnMobile(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key !== "Enter") return;
  if (!window.matchMedia("(max-width: 639.98px)").matches) return;
  const scope =
    e.currentTarget.closest<HTMLElement>('form, [role="dialog"]') ??
    document.body;
  const fields = Array.from(
    scope.querySelectorAll<HTMLElement>(FIELD_SELECTOR),
  ).filter((el) => el.offsetParent !== null); // só os visíveis
  const index = fields.indexOf(e.currentTarget);
  const next = index >= 0 ? fields[index + 1] : undefined;
  if (next) {
    e.preventDefault();
    next.focus();
    if (next instanceof HTMLInputElement) next.select();
  } else {
    // Último campo: fecha o teclado (o CTA fixo volta a aparecer).
    e.currentTarget.blur();
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onFocus, onKeyDown, enterKeyHint, ...props }, ref) => (
    <input
      type={type}
      // Teclado mobile mostra "próximo" em vez de "ir".
      enterKeyHint={enterKeyHint ?? "next"}
      // Campos numéricos: seleciona o valor ao focar para facilitar sobrescrever o "0".
      onFocus={(e) => {
        if (type === "number") e.currentTarget.select();
        onFocus?.(e);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented) focusNextFieldOnMobile(e);
      }}
      className={cn(
        "flex h-11 lg:h-10 w-full rounded-sm border border-input bg-background px-3 py-2 text-base sm:text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
