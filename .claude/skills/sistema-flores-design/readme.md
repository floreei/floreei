# Sistema Flores — Design System

ERP web para **floriculturas e decoradores de eventos**. Fluxo do negócio:
cliente → orçamento → venda/evento → compras (fornecedor) → estoque →
financeiro (a receber / a pagar / caixa / DRE) → relatórios.

**Público-alvo:** inclui pessoas idosas e leigas em tecnologia. Legibilidade,
clareza e alvos de toque generosos (≥ 44px) são **requisitos**, não enfeite.
Toda a interface é em **pt-BR**.

## Fontes deste design system

Este DS foi construído a partir de uma **especificação escrita completa**
fornecida pelo cliente (tokens HSL exatos, tipografia, inventário de
componentes e padrões de UX). **A base de código não foi anexada** a este
projeto — ela é referenciada como:

- Stack: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS +
  componentes estilo shadcn/ui escritos à mão (Radix por baixo).
- Fonte de verdade dos tokens no produto: `apps/web/src/app/globals.css`
  (CSS variables HSL) mapeadas em `tailwind.config.ts`.
- Libs: React Query, React Hook Form + Zod, Recharts, sonner (toasts),
  lucide-react (ícones).

> ⚠️ **Para fidelidade máxima dos componentes**, reanexe o repositório via o
> menu de Import. As implementações aqui reconstroem a API e o visual a partir
> da especificação; valores numéricos exatos de padding/altura podem divergir
> do código real em pontos onde a spec não os fixou.

## Identidade — "Atelier botânico"

Papel **sage frio**, **verde pinho** profundo e um toque de **argila
(terracota)**. Elegante, suave, sofisticado — **sem "cara de template/IA"**.
Fugimos de propósito do clichê *creme + Playfair + terracota*. Profundidade
vem de **sombras em camadas**, não de bordas duras.

---

## CONTENT FUNDAMENTALS (copy / tom de voz)

- **Idioma:** pt-BR em 100% da interface. Datas compactas `dd/mm/aaaa`,
  moeda `R$ 1.234,56`.
- **Pessoa:** fala-se **com** o usuário de forma direta e respeitosa —
  imperativo educado nas ações ("Salvar orçamento", "Registrar pagamento"),
  3ª pessoa nos rótulos ("Cliente", "Valor total"). Evita gírias e
  anglicismos ("upload" → "enviar", "dashboard" → "painel").
- **Casing:** rótulos e botões em **Sentence case** ("Novo orçamento", não
  "Novo Orçamento"). MAIÚSCULAS reservadas a eyebrows/legendas curtas com
  tracking largo.
- **Clareza acima de esperteza:** mensagens explicam o próximo passo.
  Erros dizem o que corrigir ("Informe um valor maior que zero"), não códigos.
- **Marcadores de campo:** obrigatório = `*` vermelho; opcional = `(opcional)`
  em cinza. Nunca ambos.
- **Tom:** cordial, calmo, competente. Confirmações são tranquilizadoras
  ("Pagamento registrado."). Sem exclamações em excesso.
- **Emoji:** **não** se usa emoji na interface. Ícones vêm do set lucide-react.
- **Exemplos:**
  - Empty state: título "Nenhum orçamento ainda" + ação "Criar orçamento".
  - Toast sucesso: "Venda registrada." · erro: "Não foi possível salvar.
    Tente novamente."
  - Confirmação destrutiva: "Excluir este cliente? Esta ação não pode ser
    desfeita."

---

## VISUAL FOUNDATIONS

- **Cores:** paleta botânica fria. `primary` verde pinho (`160 34% 28%`) para
  ações e marca; `accent`/`clay` (argila) para ênfase pontual e dados, nunca
  para o corpo. Semânticos: `success` verde-musgo, `warning` âmbar,
  `destructive` vermelho-telha. Ver `tokens/colors.css`.
- **Tipografia:** **Fraunces** (serifa old-style variável, eixos `opsz` +
  `SOFT`) em títulos de página/display; **Inter** no corpo e títulos de
  seção. Hierarquia: **serif p/ página, sans semibold p/ seção**. Números
  sempre `tabular-nums`.
- **Espaçamento:** grade base 4px. Padding de card 24px, gutters 16px.
  Alvos de toque ≥ 44px (48px recomendado para ações primárias).
- **Fundos:** papel sage sólido (`--background`), **sem** gradientes
  decorativos, sem imagens full-bleed, sem texturas ruidosas. Cards brancos
  flutuam sobre o papel via sombra.
- **Cantos:** raio base **0.8rem**; cards 13px, botões 10px, inputs/badges 7px,
  pills/avatares totalmente arredondados.
- **Elevação:** três níveis de sombra em camadas (`--shadow-xs`,
  `--shadow-card`, `--shadow-lg`) com matiz verde-frio (não preto puro).
  Cards usam `--shadow-card`; popovers/dialogs `--shadow-lg`.
- **Bordas:** finas e discretas (`--border 146 14% 90%`), usadas para separar,
  não para conter. Profundidade prefere sombra a borda.
- **Cards:** fundo branco, raio lg, sombra em camadas, borda quase imperceptível.
- **Animação:** discreta e funcional. `--ease-standard`, durações 120–320ms.
  Fades e leves translações; **sem bounce**. Respeita `prefers-reduced-motion`.
- **Hover:** escurece levemente o fundo (primary) ou tinge de `secondary`
  (ghost). **Press:** sem "shrink"; leve escurecimento + sombra reduzida.
- **Foco:** anel duplo sempre visível (`--focus-ring`): halo do fundo + anel
  `ring` a 2px. Nunca `outline: none` sem substituto.
- **Transparência/blur:** parcimoniosa — overlay de dialog usa preto a ~40%;
  blur leve opcional no backdrop. Não é motivo estético do sistema.
- **Imagery:** o produto é utilitário; imagens de produto/flores aparecem em
  catálogo, não como decoração de UI. Tom das fotos: quente e natural, para
  contrastar com a UI fria — mas fora do escopo dos tokens.

---

## ICONOGRAPHY

- **Set:** **lucide-react** (traço 1.5–2px, cantos suaves, monolinha). É o
  único sistema de ícones da interface.
- **Uso:** ícones acompanham rótulos em botões/menus; tamanho padrão 20px
  (16px em contextos densos, 24px em ações primárias/toque). Cor herda o texto
  (`currentColor`).
- **Sem emoji.** Sem caracteres unicode como ícones. Sem SVGs decorativos
  desenhados à mão.
- **Neste DS:** os cards e UI kits carregam Lucide via CDN
  (`lucide@latest`) — mesmo traço/estilo do produto. Ao usar em produção,
  mantenha `lucide-react`.

> **Logo:** nenhuma marca gráfica foi fornecida. Onde um logo apareceria,
> renderizamos o nome **"Sistema Flores"** em Fraunces. Não desenhe um logo.

---

## Índice / manifest

- `styles.css` — entrada global (apenas @imports).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
  `elevation.css`, `base.css`.
- `components/ui/` — primitivas base (Button, Card, Input, Select, Label,
  Textarea, Badge, StatusBadge, Skeleton, Tabs, Table, Dialog, DropdownMenu,
  Sheet, Avatar, Separator, CurrencyInput).
- `components/shared/` — compostos (Field, PageHeader, EmptyState,
  ConfirmDialog).
- `ui_kits/erp/` — recriação de telas do ERP (painel, orçamentos, financeiro),
  com `index.html` interativo + `Sidebar/Topbar/PainelScreen/OrcamentosScreen/
  FinanceiroScreen/Icons`.
- `cards/*.card.html` — specimens de fundamentos (populam a aba Design System).
- `SKILL.md` — torna o DS utilizável como Agent Skill.

### Componentes disponíveis
`ui/`: Button, Card (+Header/Body/Footer), Input, Textarea, Label, Select,
CurrencyInput, Badge, StatusBadge, Skeleton, Tabs, Table, Dialog, DropdownMenu,
Sheet, Avatar, Separator.
`shared/`: Field, PageHeader, EmptyState, ConfirmDialog.

### Intentional additions
- **StatusBadge** — variante semântica de Badge para status de negócio
  (pago, pendente, atrasado, rascunho). Presente na spec do produto.
