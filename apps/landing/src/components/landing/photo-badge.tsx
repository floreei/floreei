import { cn } from "@/lib/utils";

/** Selo flutuante sobre foto: ícone + texto, cartão branco. */
export function PhotoBadge({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
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
    </div>
  );
}

/** Selo flutuante de estatística sobre foto: cartão colorido com número grande. */
export function StatBadge({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute z-10 rounded-xl bg-clay px-4 py-3 text-clay-foreground shadow-lg",
        className,
      )}
    >
      <p className="sf-serif text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1 text-xs leading-tight text-clay-foreground/85">
        {label}
      </p>
    </div>
  );
}
