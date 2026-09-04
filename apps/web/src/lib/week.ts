const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Semana de segunda a domingo (data local) que contém `now`. */
export function currentWeekRange(now: Date = new Date()): { from: string; to: string } {
  // getDay: 0=dom … 6=sáb → distância até a segunda anterior (dom = 6).
  const offset = (now.getDay() + 6) % 7;
  const monday = addDays(now, -offset);
  return { from: toIso(monday), to: toIso(addDays(monday, 6)) };
}

/** true quando `from`→`to` é exatamente uma semana seg→dom. */
export function isWeekRange(from: string, to: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return false;
  const start = fromIso(from);
  return start.getDay() === 1 && toIso(addDays(start, 6)) === to;
}

/** Desloca a semana em `weeks` (negativo = anterior). */
export function shiftWeek(from: string, to: string, weeks: number) {
  return { from: toIso(addDays(fromIso(from), weeks * 7)), to: toIso(addDays(fromIso(to), weeks * 7)) };
}

/** "31/08 – 06/09" — rótulo curto do chip de semana. */
export function formatShortRange(from: string, to: string): string {
  const f = fromIso(from);
  const t = fromIso(to);
  return `${pad(f.getDate())}/${pad(f.getMonth() + 1)} – ${pad(t.getDate())}/${pad(t.getMonth() + 1)}`;
}
