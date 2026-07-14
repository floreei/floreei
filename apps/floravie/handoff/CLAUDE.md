# CLAUDE.md — Floravie Ateliê Storefront

## Missão

Implementar o storefront da Floravie Ateliê **exatamente igual** ao protótipo aprovado.

## Fonte da verdade (nesta ordem)

1. `reference/floravie-loja-completa.html` — protótipo aprovado. A implementação deve ser
   **pixel-faithful**: mesmas cores, fontes, espaçamentos, textos, animações e fluxos.
2. `DESIGN-SPEC.md` — especificação escrita (tokens, componentes, medidas, regras de negócio).
3. `tokens.css` / `tokens.json` — tokens prontos para importar.

## Regras inegociáveis

- **NÃO redesenhar.** Não trocar paleta, fontes, raios, sombras ou copy. O cliente aprovou
  este visual e não quer nenhuma mudança estética.
- Todo texto da interface permanece em **PT-BR**, exatamente como no HTML de referência.
- Fontes: Cormorant Garamond (display) + Jost (corpo), via Google Fonts.
- Antes de dar qualquer componente como pronto, **comparar lado a lado com o HTML de
  referência aberto no navegador**.

## O que implementar

- Home completa: topbar, header sticky, nav com dropdowns, hero (foto em arco + campo de
  endereço + pétalas animadas), benefícios, 2 carrosséis de produtos, grid de ocasiões,
  seção história, cidades, newsletter, footer, WhatsApp flutuante.
- Modal de detalhe do produto (tamanhos com delta de preço, quantidade 1–9, preço reativo).
- Sacola em drawer lateral (frete R$ 14,90, grátis ≥ R$ 150, barra "faltam R$ X").
- Checkout em 4 etapas (Entrega → Mensagem → Pagamento → Revisão) + tela de sucesso
  com nº de pedido `FLV-XXXX`. Pix = 5% off; cartão = 3x sem juros.
- Toast de feedback e fallback de imagem (degradê + flor SVG) conforme a referência.

## Notas técnicas

- Stack alvo: Next.js (App Router) + TypeScript. Estilização livre (CSS Modules, Tailwind
  com tokens mapeados, ou styled) **desde que o resultado visual seja idêntico**.
- Estado do carrinho/checkout pode ser client-side (Zustand/Context). Persistência e
  pagamento real ficam para fase posterior — manter os mesmos comportamentos do protótipo.
- Modelar dados a partir das types em `DESIGN-SPEC.md` §6.
- Imagens: hoje são Unsplash (hotlink permitido). Estruturar para troca fácil pelas fotos
  próprias (mesmo aspect-ratio: cards 1/1.04, hero 1/1.15).
- Acessibilidade: manter `role="dialog"`, `aria-modal`, `aria-label`, fechamento por Esc,
  focus-visible rosé e `prefers-reduced-motion`.

## Definition of Done

- [ ] Lado a lado com `reference/floravie-loja-completa.html`, não há diferença visual perceptível
- [ ] Fluxo completo funciona: card → modal → sacola → checkout 4 etapas → sucesso → sacola limpa
- [ ] Frete, frete grátis, desconto Pix e parcelamento calculam como na referência
- [ ] Responsivo idêntico nos breakpoints 920/820/760/720/640/560px
- [ ] Textos idênticos aos da referência (sem "melhorias" de copy)
