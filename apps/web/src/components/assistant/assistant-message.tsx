import type { ReactNode } from "react";

/**
 * Renderiza o texto do assistente com o mínimo de Markdown que ele usa —
 * **negrito**, quebras de linha e listas (1. / -) — sem dependência externa.
 * A IA responde em Markdown; sem isso os `**` e as quebras apareceriam crus.
 */
export function AssistantMessage({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const ordered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (ordered) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-semibold tabular-nums">
                {ordered[1]}.
              </span>
              <span className="min-w-0">{renderInline(ordered[2])}</span>
            </div>
          );
        }
        const bullet = trimmed.match(/^[-•*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0">•</span>
              <span className="min-w-0">{renderInline(bullet[1])}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

/** Converte **negrito** em <strong>, mantendo o resto como texto. */
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong key={key++} className="font-semibold">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
