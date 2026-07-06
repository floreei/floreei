import { cn } from "@/lib/utils";

/** Cabeçalho de seção: eyebrow + título serif + subtítulo opcional. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="sf-serif t-section mt-3 font-semibold leading-tight">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
