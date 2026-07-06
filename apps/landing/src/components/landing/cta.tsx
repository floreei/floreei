import { cn } from "@/lib/utils";

type Variant = "primary" | "clay" | "outline";

/** Botão-link de call-to-action (âncora interna ou link externo em nova aba). */
export function Cta({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={cn(
        "sf-cta",
        variant === "primary" && "sf-cta-primary",
        variant === "clay" && "sf-cta-clay",
        variant === "outline" && "sf-cta-outline",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
