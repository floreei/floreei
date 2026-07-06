import type { CompanyAccessStatus } from "@sistema-flores/types";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const MAP: Record<
  CompanyAccessStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  ACTIVE: { label: "Ativa", variant: "success" },
  TRIAL: { label: "Período gratuito", variant: "default" },
  EXPIRED: { label: "Expirada", variant: "warning" },
  SUSPENDED: { label: "Suspensa", variant: "destructive" },
};

/** Selo de status de acesso da empresa (com dias de trial quando couber). */
export function StatusBadge({
  status,
  trialDaysLeft,
}: {
  status: CompanyAccessStatus;
  trialDaysLeft?: number | null;
}) {
  const cfg = MAP[status];
  const suffix =
    status === "TRIAL" && trialDaysLeft != null ? ` · ${trialDaysLeft}d` : "";
  return (
    <Badge variant={cfg.variant}>
      {cfg.label}
      {suffix}
    </Badge>
  );
}
