import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  /** Mostra asterisco vermelho (campo obrigatório). */
  required?: boolean;
  /** Mostra "(opcional)" ao lado do rótulo. */
  optional?: boolean;
  /** Ação secundária alinhada à direita do rótulo (ex.: link "Nova categoria"). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Rótulo + controle + estado (obrigatório/opcional/erro) padronizados. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  optional,
  action,
  className,
  children,
}: FieldProps) {
  return (
    <div
      className={cn("space-y-1.5", className)}
      data-field-invalid={error ? "true" : undefined}
    >
      {/* leading-none nos marcadores impede que o "*"/"(opcional)" estiquem a
          linha do rótulo — assim campos com/sem marcador alinham os controles
          na mesma grade (sem altura fixa, para não cortar rótulos que quebrem). */}
      <div className="flex min-h-5 items-center gap-1 leading-none">
        <Label htmlFor={htmlFor}>{label}</Label>
        {required ? (
          <span
            className="text-sm leading-none text-destructive"
            aria-hidden="true"
            title="Obrigatório"
          >
            *
          </span>
        ) : optional ? (
          <span
            className="text-xs font-normal leading-none text-muted-foreground/80"
            aria-hidden="true"
          >
            (opcional)
          </span>
        ) : null}
        {action ? <span className="ml-auto">{action}</span> : null}
      </div>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
