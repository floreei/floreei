# Design

Sistema visual do Floreei (fonte de verdade dos tokens: `apps/web/src/app/globals.css`;
os demais apps espelham). Register: **product** — o design serve a tarefa.

## Theme

"Ateliê de florista": papel sage claro e sólido (sem gradientes decorativos), cards
brancos que flutuam por sombra em camadas de tom verde-frio, serif expressiva só em
títulos. Dark mode completo via classe `.dark` (mesmos papéis semânticos).

## Palette (HSL, papéis semânticos)

| Papel | Light | Uso |
|---|---|---|
| `--background` | `140 16% 98%` | papel sage do app |
| `--foreground` | `165 16% 15%` | texto |
| `--primary` | `160 34% 28%` (verde folha) | ações primárias, seleção, foco |
| `--clay` | `16 54% 55%` (terracota) | acento quente — segunda voz da marca |
| `--secondary` / `--muted` | `146 20% 93%` / `144 16% 95%` | superfícies neutras |
| `--accent` | `22 44% 92%` | tint de argila p/ destaques suaves |
| `--success` / `--warning` / `--destructive` | `152 40% 34%` / `32 72% 48%` / `4 62% 52%` | estados |
| `--border` / `--input` / `--ring` | `146 14% 90%` / `86%` / `= primary` | contornos e foco |
| `--chart-1..5` | verde, clay, petróleo, âmbar, violeta | Recharts |

Acento é significado (ação/estado/seleção), nunca decoração. Estratégia: Restrained.

## Typography

- **Sans** (`--font-sans`): corpo, labels, dados, botões — tudo funcional.
- **Serif Fraunces** (`--font-serif`, com `opsz` + eixo `SOFT 40`): títulos de página,
  números de dinheiro em destaque, logo. Presença artesanal sem perder legibilidade.
- Escala fixa (rem), passos contidos; `PageHeader` título `text-3xl sm:text-[2.05rem]`.
- Dados monetários: `tabular-nums`.

## Shape & Elevation

- Radius por elemento: `--radius-sm` ~7px inputs/badges · `md` ~10px botões ·
  `lg` ~13px cards · `xl` ~19px dialogs/sheets.
- Sombras em camadas verde-frias (`--shadow-xs/card/lg`) — nunca preto puro.
- Foco sempre visível: `--focus-ring` (2px fundo + 4px ring primário).

## Motion

Tokens: `--ease-standard cubic-bezier(0.32,0.08,0.24,1)`, durações 120/200/320ms.
Motion comunica estado (abrir, confirmar, carregar) — nada orquestrado no load.
`prefers-reduced-motion` sempre respeitado (framer-motion `useReducedMotion`).

## Components (shadcn-style, `apps/web/src/components/ui/`)

avatar · badge · button · card · command (⌘K) · currency-input · dialog (max-h 90dvh,
scroll interno, `DialogFooter` sticky) · dropdown-menu · input · label · popover ·
select · separator · sheet (drawer lateral) · skeleton · table (wrapper overflow) ·
tabs · textarea. Shared: page-header, empty-state (ensina o próximo passo), field,
confirm-dialog, status-badge, file-upload, print-*.

Alturas de controle: **mobile ≥44px (`h-11`), desktop denso 40px (`h-10`)** — padrão
`h-11 lg:h-10`.

## Layout

- Desktop: sidebar fixa `w-64` (grupos: Dia a dia / Suprimentos / Gestão) + topbar
  sticky com busca global; `main` `max-w-6xl`.
- **Mobile: bottom nav fixa** (Início · Vendas · ⭕ Nova venda central · Clientes ·
  Mais→drawer), conteúdo com respiro `pb-24`; safe-area respeitada.
- Listas: **tabela no desktop, cartões empilhados no mobile** (`ListCard` tocável,
  ≥56px). Formulários longos: modal no desktop, **tela cheia no mobile** com CTA fixo.
