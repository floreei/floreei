# Product

## Register

product

## Users

Donas e donos de floriculturas, floristas autônomos e decoradores de eventos no
Brasil. Público majoritariamente leigo em tecnologia, de várias idades, operando
no balcão da loja ou na rua — **muitas vezes pelo celular**, com uma mão, entre
um atendimento e outro. O trabalho deles é flores, não software: o sistema
precisa desaparecer na tarefa.

Superfícies: `apps/web` (ERP do florista — a superfície principal), `apps/admin`
(console interno do gestor da plataforma), `apps/landing` (marketing),
`apps/loja` (vitrine pública dos clientes finais).

## Product Purpose

O Floreei é o ERP da floricultura inteira num lugar só: venda direta, atacado
e eventos, orçamentos, buquês com custo/preço calculados, insumos e estoque,
compras, despesas, caixa e resultado do mês — mais uma loja online por empresa.
Sucesso = o florista registra a venda em segundos, sabe quanto o buquê custa de
verdade e fecha o mês sem papel espalhado.

## Brand Personality

Acolhedor, artesanal, confiável. Voz calorosa em pt-BR simples ("Quem deve",
"Entrou / saiu") — linguagem de florista, nunca de contador. A marca traz o
toque humano (serif Fraunces nos títulos, verdes de folha, terracota); o
produto traz a calma de quem resolve.

## Anti-references

- ERP corporativo denso e cinza (Totvs/SAP-like): telas lotadas, jargão contábil,
  menus infinitos.
- Dashboard SaaS genérico: hero-metrics com gradiente, cards idênticos em grade,
  cor decorativa sem significado.
- "Desktop espremido" no celular: tabelas com scroll lateral, alvos minúsculos,
  tudo escondido atrás de hambúrguer.

## Design Principles

1. **O balcão manda.** A ação nº 1 (registrar venda) está sempre a um toque, em
   qualquer tela, em qualquer dispositivo.
2. **Polegar primeiro.** No celular: navegação embaixo, alvos ≥44px, CTAs fixos
   ao alcance; formulários longos ganham a tela inteira.
3. **Fala de florista.** Rótulos e mensagens no vocabulário do dia a dia da
   loja; números sempre com contexto ("Com 1 usuário: R$ 79/mês").
4. **Familiaridade ganha de surpresa.** Padrões conhecidos de apps que o público
   já usa (lista em cartões, abas, badges); consistência entre telas é virtude.
5. **Todo estado responde.** Vazio ensina o próximo passo, carregando usa
   skeleton, erro diz o que fazer — nunca tela muda.

## Accessibility & Inclusion

Público leigo e etariamente diverso: contraste de corpo ≥4.5:1, alvos de toque
≥44px no mobile, texto base ≥16px em formulários, `prefers-reduced-motion`
respeitado em toda animação (padrão já seguido via framer-motion), dark mode
disponível. Sem dependência de hover para nenhuma função.
