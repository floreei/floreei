import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onFocus, ...props }, ref) => (
    <input
      type={type}
      // Campos numéricos: seleciona o valor ao focar para facilitar sobrescrever o "0".
      onFocus={(e) => {
        if (type === "number") e.currentTarget.select();
        onFocus?.(e);
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
