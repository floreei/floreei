---
name: sistema-flores-design
description: Use this skill to generate well-branded interfaces and assets for Sistema Flores (ERP botânico para floriculturas e decoradores), either for production or throwaway prototypes/mocks. Contains design guidelines, color/type tokens, fonts, icon guidance, and UI kit components for prototyping. Interface is pt-BR; público inclui idosos/leigos, então legibilidade e alvos ≥44px são requisitos.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Onde as coisas estão
- `styles.css` — entrada global (só @imports). Linke este arquivo.
- `tokens/` — colors, typography, spacing, elevation, fonts, base.
- `components/ui/` e `components/shared/` — primitivas React (props em `.d.ts`,
  uso em `.prompt.md`).
- `ui_kits/erp/` — telas do ERP (painel, orçamentos, financeiro) já compostas.
- `cards/` — specimens de fundamentos.

## Regras não-negociáveis
- pt-BR em toda a interface; datas `dd/mm/aaaa`; moeda `R$ 0,00` com tabular-nums.
- Sem emoji. Ícones = lucide (traço ~1.75).
- Alvos de toque ≥ 44px; foco sempre visível; respeitar prefers-reduced-motion.
- Serif (Fraunces) só p/ título de página; sans (Inter) p/ seções e corpo.
- Profundidade vem de sombra em camadas, não de borda dura. Nada de
  creme+Playfair+terracota genérico.
