# Floravie Ateliê — Especificação de Design & Implementação

> **Regra de ouro:** o arquivo `reference/floravie-loja-completa.html` é a fonte da verdade.
> A implementação final deve ficar **visualmente idêntica** a ele. Em caso de dúvida entre
> este documento e o HTML de referência, **o HTML vence**. Não "melhorar", não redesenhar,
> não trocar cores, fontes ou espaçamentos.

---

## 1. Identidade da marca

- **Nome:** Floravie Ateliê (logotipo: "Flora**vie**" — o "vie" em itálico rosé + tagline "ATELIÊ FLORAL")
- **Personalidade:** ateliê floral artesanal, elegante, afetivo, feminino sem ser infantil
- **Localização:** Recife/PE — entrega na Região Metropolitana do Recife
- **Tom de voz:** caloroso, poético com moderação, direto nos CTAs ("Comprar agora", "Finalizar pedido")

---

## 2. Design Tokens

### 2.1 Cores (CSS custom properties — usar exatamente estes hex)

| Token | Hex | Uso |
|---|---|---|
| `--ivory` | `#FBF8F2` | Fundo geral do site |
| `--paper` | `#FFFFFF` | Cards, header, superfícies elevadas |
| `--ink` | `#26332C` | Texto principal, preços |
| `--green` | `#2F4A3C` | Cor primária: títulos, botões primários, topbar, newsletter |
| `--green-soft` | `#5F7A6B` | Texto secundário, descrições |
| `--rose` | `#C98A93` | Acentos, bordas hover, destaque na newsletter |
| `--rose-deep` | `#A6606C` | Hover de botões, itálicos do logo, links de destaque, badge do carrinho |
| `--rose-mist` | `#F4E4E4` | Fundos suaves: ícones de benefício, seleção de pagamento, placeholders |
| `--gold` | `#B08D57` | Eyebrows (rótulos de seção), detalhes premium, steps concluídos |
| `--line` | `#E5DCD0` | Bordas de cards, inputs e divisores |

Cores auxiliares fixas (fora dos tokens):
- Footer: fundo `#1F2A24`, texto `#C9CFC8`, logo `#F3EFE6`
- WhatsApp flutuante: `#25D366`
- Erro de formulário: `#B03030`
- Overlay: `rgba(38,51,44,.5)` com `backdrop-filter: blur(2px)`

### 2.2 Tipografia

- **Display (títulos, nomes de produto, logo):** `"Cormorant Garamond", Georgia, serif`
  - Pesos usados: 400, 500, 600 + itálico 400/500
- **Corpo/UI:** `"Jost", system-ui, sans-serif`
  - Pesos usados: 300 (padrão do body), 400, 500, 600
- Import: Google Fonts (`Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500` e `Jost:wght@300;400;500;600`)

Escala (principais):
| Elemento | Fonte | Tamanho | Extras |
|---|---|---|---|
| H1 hero | Display 500 | `clamp(2.4rem, 5vw, 3.9rem)` | line-height 1.08; palavra de destaque em `<em>` itálico rosé |
| H2 seção | Display 500 | `clamp(1.7rem, 3vw, 2.4rem)` | cor `--green` |
| Nome produto (card) | Display 600 | 1.22rem | line-height 1.25 |
| Nome produto (modal) | Display 600 | 2rem | |
| Eyebrow | Jost 500 | 0.72rem | UPPERCASE, letter-spacing 0.28em, cor `--gold` |
| Corpo | Jost 300 | 1rem base | line-height 1.6 |
| Nav categorias | Jost 400 | 0.78rem | UPPERCASE, letter-spacing 0.18em |
| Botões/CTAs | Jost 500 | 0.74–0.78rem | UPPERCASE, letter-spacing 0.16–0.2em |
| Preço card | Jost 500 | 1.18rem | |
| Preço modal | Jost 500 | 1.7rem | |

### 2.3 Forma, sombra e movimento

- Raio padrão: `--radius: 14px` (cards, inputs 10px, sheets `radius*1.4`, about-art `radius*2`)
- Pílulas: `border-radius: 999px` (botões, chips, busca, tamanhos)
- Sombra padrão: `--shadow: 0 10px 30px rgba(47,74,60,.10)`
- Sombra do hero-photo: `0 24px 60px rgba(47,74,60,.22)` + borda `6px solid #fff`
- Transições: `.2s` para cor/fundo, `.25s` para transform de cards, `.3s` drawer, `.5s` zoom da imagem
- Hover de card: `translateY(-5px)` + shadow; imagem interna `scale(1.05)`
- Animação de pétalas no hero: keyframes `drift` (9s, ease-in-out, infinite, translateY -22px + rotate 18deg), 3 pétalas com delays 0s/2.5s/5s
- Respeitar `prefers-reduced-motion: reduce` (desativa animações/transições)

### 2.4 Layout & breakpoints

- Container: `max-width: 1200px`, padding lateral `24px`
- Breakpoints usados: `920px` (menu mobile, hero empilha), `820px` (benefícios/ocasiões/news empilham), `760px` (modal produto empilha), `720px` (rails viram touch 72%/card, esconde setas e topbar-msg), `640px` (form 1 coluna), `560px` (footer 1 coluna)

---

## 3. Estrutura da página (ordem exata das seções)

1. **Topbar** (verde): "Entrega no mesmo dia em Recife e região · Pedidos até 16h" + links Minha conta / Acompanhar pedido / Ajuda
2. **Header** (sticky, z-60): hambúrguer (mobile) · logo · busca pílula · Favoritos · Sacola com contador
3. **Nav de categorias** com dropdowns: Buquês, Arranjos, Flores em Vaso, Cestas de Presente, Ocasiões, Onde entregamos
4. **Hero** (degradê 160deg: `#F7EFE8` → `--rose-mist` 55% → `#EFE6DA`): eyebrow + H1 "Para quem vai *florescer* o seu dia?" + lead + **campo de endereço em pílula** com botão "Ver opções" + nota "Pedidos confirmados até 16h chegam hoje mesmo" | à direita, **foto em moldura de arco** (border-radius `220px 220px 18px 18px`), contorno dourado deslocado 14px atrás, 3 pétalas animadas
5. **Benefícios** (3 colunas): Entrega no mesmo dia · Flores frescas do dia · Até 3x sem juros (ícones em círculo `--rose-mist`)
6. **Vitrine "Buquês do Ateliê"** — carrossel horizontal com setas circulares sobrepostas (esq/dir)
7. **Ocasiões** (grid 4×2, fotos de fundo + overlay gradiente escuro de baixo): Amor & Romance, Aniversário, Agradecimento, Maternidade, Melhoras, Dia das Mães, Corporativo, Condolências
8. **Vitrine "Arranjos, Vasos & Cestas"** — mesmo padrão de carrossel
9. **Sobre / Nossa história** — foto arredondada à esquerda, texto + CTA rosé à direita
10. **Cidades** (centralizado): pílulas com as 10 cidades da RMR
11. **Newsletter** (fundo `--green`): título com *flores* em itálico rosé + form pílula translúcido
12. **Footer** (`#1F2A24`, 4 colunas): logo+descrição · Institucional · Ajuda · Contato; barra final com copyright/CNPJ
13. **WhatsApp flutuante** (fixo, bottom-right 26px, 58px, `#25D366`)

---

## 4. Componentes (medidas-chave)

### Card de produto
- Fundo `--paper`, borda `1px --line`, raio 14px, cursor pointer
- Imagem: `aspect-ratio: 1/1.04`, object-fit cover, zoom 1.05 no hover
- Badge (opcional): pílula branca, texto `--rose-deep`, 0.62rem UPPERCASE, top/left 12px
- Conteúdo: nome (Display 600) → estrelas douradas + (nº avaliações) → linha de preço (preço + "3x de R$ X,XX")
- Botão "Adicionar à sacola": ghost verde (borda 1px), pílula, hover inverte (fundo verde/texto branco)
- Clique no card → abre modal de produto; clique no botão → adiciona direto (stopPropagation)

### Carrossel (rail)
- `display:grid; grid-auto-flow:column; grid-auto-columns:minmax(240px,1fr); gap:22px`
- `overflow-x:auto; scroll-snap-type:x mandatory`, scrollbar oculta
- Setas: círculos 44px, fundo branco, borda `--line`, sobrepostas (-14px), hover fundo verde
- Mobile ≤720px: setas ocultas, cards a 72% da largura, rolagem por toque

### Modal de produto (overlay + sheet)
- Sheet: max-width 960px, raio ~20px, max-height 92vh, grid 2 colunas (foto | info)
- Info: eyebrow da categoria → nome → estrelas → preço grande (recalcula: `(base + delta do tamanho) × quantidade`) + "ou 3x de … sem juros" → descrição → **Tamanho** (pílulas; selecionada = fundo verde; mostra "+ R$ X" ou "incluso") → **Quantidade** (stepper − n +, limites 1–9) → dois botões: "Adicionar à sacola" (ghost) e "Comprar agora" (primário, vai direto ao checkout) → meta com dashed border: 🚚 Hoje até 16h · ✍️ cartão grátis · 🌱 flores do dia
- Fecha por ✕, clique no backdrop ou tecla Esc

### Sacola (drawer lateral direito)
- Largura `min(420px, 100%)`, desliza da direita (.3s), backdrop próprio
- Item: grid `76px | 1fr | auto` → miniatura 76px arredondada, nome/tamanho/preço/“remover”, stepper vertical compacto
- Rodapé (fundo `--ivory`): banner de frete ("Faltam R$ X para frete grátis 🚚" ou "Você ganhou frete grátis! 🎉") → Subtotal → Frete → **Total** → botão "Finalizar pedido"
- Vazio: ícone de sacola rosé + "Sua sacola está vazia. Que tal escolher umas flores?"

### Checkout (modal, 4 etapas com stepper)
Stepper: Entrega → Mensagem → Pagamento → Revisão. Ativa = barra `--rose-deep`; concluída = dourada com "✓".

1. **Entrega:** nome de quem recebe*, telefone*, cidade (select com as 10 da RMR), endereço*, chips de data (Hoje/Amanhã/Agendar → revela date input), chips de período (Manhã 8h–12h / Tarde 13h–18h). Validação: campos * obrigatórios, erro vermelho abaixo do campo.
2. **Mensagem:** textarea da mensagem do cartão (opcional; hint "escrita à mão pela nossa equipe"), assinatura, checkbox "admirador(a) secreto(a) 🤫" (desabilita a assinatura).
3. **Pagamento:** radio cards — **Pix** (tag dourada "5% off", mostra total com desconto; caixa tracejada com QR placeholder) ou **Cartão** (3x sem juros; campos número/nome/validade/CVV com validação de preenchimento).
4. **Revisão:** 3 boxes (Entrega, Cartão de mensagem, Itens & pagamento) com link "editar" que volta à etapa; totais com desconto Pix se aplicável; "Confirmar pedido".

**Sucesso:** círculo rosé com check → "Pedido confirmado! 🌷" → nº `FLV-XXXX` (aleatório 4 dígitos) → resumo da entrega → botão "Voltar à loja" (limpa a sacola).

### Toast
Pílula verde, centralizada no rodapé, sobe/desce com transição .3s, some após 2,2s. Ex.: "Adicionado à sacola 🌷".

---

## 5. Regras de negócio (protótipo)

| Regra | Valor |
|---|---|
| Frete padrão | R$ 14,90 |
| Frete grátis | subtotal ≥ R$ 150,00 |
| Desconto Pix | 5% sobre (subtotal + frete) |
| Parcelamento | 3x sem juros (exibir "3x de R$ X,XX") |
| Quantidade por item | mín. 1, máx. 9 |
| Preço com tamanho | `preço base + delta do tamanho` |
| Merge no carrinho | mesmo produto + mesmo tamanho somam quantidade |
| Moeda | `R$ 1.234,56` (vírgula decimal) |
| Nº do pedido | `FLV-` + 4 dígitos |

## 6. Catálogo (12 produtos)

Categoria `buques`: Buquê 12 Rosas Rosé (R$ 189,90; 12/18/24 rosas +0/+60/+120; badge "Mais vendido") · Girassóis Alegria (159,90; 5/8 +0/+45) · Flores do Campo (139,90; badge "Novo") · Jardim Tropical (174,90) · Serenidade Branca (199,90) · Surpresa da Florista (149,90; P/G/Deluxe).
Categoria `cestas`: Orquídea Phalaenopsis Lilás (219,90; 1/2 hastes; badge "Dura +30 dias") · Arranjo Jardim Rosé (249,90) · Cesta Bom Dia com Flores (289,90; 1/2 pessoas; badge "Café da manhã") · Cesta Vinho & Delícias (329,90) · Urso de Pelúcia com Laço (99,90; 30/50cm; badge "Fofura") · Cesta de Flores no Vime (209,90).

Estruturas de dados de referência (usar como base do modelo):
```ts
type Product = { id:string; cat:'buques'|'cestas'; name:string; price:number;
  img:string; badge:string|null; rating:string; reviews:number; desc:string;
  sizes:{l:string; d:number}[] };
type CartItem = { id:string; sizeIdx:number; qty:number };
type Order = { dest:string; fone:string; end:string; cidade:string;
  data:'hoje'|'amanha'|'agendar'; dataAg?:string; periodo:'manha'|'tarde';
  msg:string; de:string; anon:boolean; pay:'pix'|'cartao';
  cardNum?:string; cardNome?:string; cardVal?:string; cardCvv?:string };
```

## 7. Imagens

- Atuais: Unsplash CDN (`images.unsplash.com/photo-…?q=80&w=800&auto=format&fit=crop`) — licença gratuita p/ uso comercial. IDs no HTML de referência.
- **Produção:** substituir pelas fotos reais da Floravie mantendo enquadramento quadrado (1/1.04) e hero vertical (1/1.15).
- **Fallback obrigatório:** em erro de carregamento, substituir por degradê `#F4E4E4 → #EFE6DA` com a flor SVG estilizada centralizada (ver `attachImgFallback()` no HTML).

## 8. Acessibilidade & detalhes

- `:focus-visible` com outline `--rose-deep` 2px, offset 3px
- Overlays com `role="dialog"` e `aria-modal="true"`; fechar com Esc; body com scroll travado (`.locked`)
- Botões de ícone com `aria-label`; imagens com `alt` descritivo em PT-BR
- `prefers-reduced-motion` respeitado
- Todo o microcopy em PT-BR — manter exatamente os textos do HTML de referência
