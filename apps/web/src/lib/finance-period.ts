/**
 * Cálculo dos intervalos de período do Financeiro. Presets + intervalo
 * personalizado, sempre com o **período anterior** para calcular tendências.
 * Datas locais no formato AAAA-MM-DD (sem fuso).
 */

export type PeriodPreset =
  | "thisMonth"
  | "lastMonth"
  | "last3Months"
  | "thisYear"
  | "custom";

export interface ResolvedPeriod {
  from: string;
  to: string;
  /** Rótulo curto para exibição (ex.: "Julho de 2026"). */
  label: string;
  /** Janela imediatamente anterior, de mesmo tamanho (para tendência). */
  prevFrom: string;
  prevTo: string;
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "thisMonth", label: "Este mês" },
  { value: "lastMonth", label: "Mês passado" },
  { value: "last3Months", label: "Últimos 3 meses" },
  { value: "thisYear", label: "Este ano" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const firstOfMonth = (y: number, m: number) => new Date(y, m, 1);
const lastOfMonth = (y: number, m: number) => new Date(y, m + 1, 0);
const parseIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function monthYear(y: number, m: number) {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      new Date(y, m, 1),
    ),
  );
}
export function shortMonth(y: number, m: number) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(y, m, 1))
    .replace(".", "");
}
function ddmmaaaa(sIso: string) {
  const d = parseIso(sIso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function monthRange(y: number, m: number): ResolvedPeriod {
  const prev = new Date(y, m - 1, 1);
  const py = prev.getFullYear();
  const pm = prev.getMonth();
  return {
    from: iso(firstOfMonth(y, m)),
    to: iso(lastOfMonth(y, m)),
    label: monthYear(y, m),
    prevFrom: iso(firstOfMonth(py, pm)),
    prevTo: iso(lastOfMonth(py, pm)),
  };
}

/** Resolve o intervalo do período (e o anterior) a partir do preset/custom. */
export function resolvePeriod(
  preset: PeriodPreset,
  custom?: { from: string; to: string },
): ResolvedPeriod {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "thisMonth":
      return monthRange(y, m);
    case "lastMonth": {
      const d = new Date(y, m - 1, 1);
      return monthRange(d.getFullYear(), d.getMonth());
    }
    case "last3Months": {
      const start = new Date(y, m - 2, 1);
      const end = lastOfMonth(y, m);
      const pStart = new Date(y, m - 5, 1);
      const pEndBase = new Date(y, m - 3, 1);
      const pEnd = lastOfMonth(pEndBase.getFullYear(), pEndBase.getMonth());
      return {
        from: iso(start),
        to: iso(end),
        label: `${shortMonth(start.getFullYear(), start.getMonth())}–${shortMonth(y, m)} de ${y}`,
        prevFrom: iso(pStart),
        prevTo: iso(pEnd),
      };
    }
    case "thisYear":
      return {
        from: iso(new Date(y, 0, 1)),
        to: iso(new Date(y, 11, 31)),
        label: String(y),
        prevFrom: iso(new Date(y - 1, 0, 1)),
        prevTo: iso(new Date(y - 1, 11, 31)),
      };
    case "custom": {
      const from = custom?.from || iso(firstOfMonth(y, m));
      const to = custom?.to || iso(lastOfMonth(y, m));
      const fromD = parseIso(from);
      const toD = parseIso(to);
      const days = Math.max(
        0,
        Math.round((toD.getTime() - fromD.getTime()) / 86_400_000),
      );
      const prevTo = new Date(fromD);
      prevTo.setDate(prevTo.getDate() - 1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - days);
      return {
        from,
        to,
        label: `${ddmmaaaa(from)} a ${ddmmaaaa(to)}`,
        prevFrom: iso(prevFrom),
        prevTo: iso(prevTo),
      };
    }
  }
}

/** É uma data de vencimento vencida (anterior a hoje)? */
export function isOverdue(dateIso: string): boolean {
  return dateIso < iso(new Date());
}
