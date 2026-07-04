# UI Kit — Sistema Flores ERP

Recriação interativa das telas centrais do ERP, compondo as primitivas do
design system (`window.SistemaFloresDesignSystem_d212f4`).

## Telas
- **Painel** (`PainelScreen.jsx`) — saudação, KPIs, gráfico de faturamento
  (barras simples), próximos eventos e contas a receber.
- **Orçamentos** (`OrcamentosScreen.jsx`) — resumo + tabela com menu de ações;
  botão "Novo orçamento" abre o Dialog de formulário multi-coluna.
- **Financeiro** (`FinanceiroScreen.jsx`) — cards de saldo + abas
  (A receber / A pagar / Caixa) sobre tabela.

## Chrome
- `Sidebar.jsx` — navegação em grupos (Dia a dia / Suprimentos / Gestão).
- `Topbar.jsx` — busca ⌘K, notificações, usuário.
- `Icons.jsx` — subconjunto lucide (traço 1.75) usado no kit.

## Executar
Abra `index.html`. Ele carrega `_ds_bundle.js` (raiz do projeto) e os módulos
via Babel. A navegação da sidebar troca as telas; o Dialog de novo orçamento
é funcional (fecha ao confirmar).

> Nota: gráficos aqui são uma aproximação em HTML/CSS. No produto usa-se
> Recharts com as cores `--chart-*`.
