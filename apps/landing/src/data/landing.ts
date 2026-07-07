import {
  CalendarCheck,
  DollarSign,
  FileText,
  Package,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  title: string;
  desc: string;
  icon: LucideIcon;
  bg: string;
  fg: string;
}

/** 6 módulos — grid de funcionalidades. */
export const features: Feature[] = [
  {
    title: "Orçamentos rápidos",
    desc: "Monte orçamentos bonitos em minutos e envie por WhatsApp. O cliente aprova e vira venda automaticamente.",
    icon: FileText,
    bg: "hsl(var(--primary) / .1)",
    fg: "hsl(var(--primary))",
  },
  {
    title: "Vendas e balcão",
    desc: "Registre vendas do balcão e de eventos na mesma tela, com desconto, observações e baixa automática no estoque.",
    icon: ShoppingCart,
    bg: "hsl(var(--clay) / .14)",
    fg: "hsl(var(--clay))",
  },
  {
    title: "Controle de estoque",
    desc: "Saiba o que tem em vaso, o que está acabando e o que precisa comprar. Alertas de flores perecíveis.",
    icon: Package,
    bg: "hsl(var(--chart-3) / .14)",
    fg: "hsl(var(--chart-3))",
  },
  {
    title: "Financeiro e caixa",
    desc: "Contas a pagar e receber, fluxo de caixa e fechamento do dia. Feche o mês sabendo quanto sobrou.",
    icon: DollarSign,
    bg: "hsl(var(--success) / .14)",
    fg: "hsl(var(--success))",
  },
  {
    title: "Agenda de eventos",
    desc: "Casamentos, aniversários e corporativos organizados por data. Nunca mais esqueça uma entrega.",
    icon: CalendarCheck,
    bg: "hsl(var(--chart-5) / .16)",
    fg: "hsl(var(--chart-5))",
  },
  {
    title: "Cadastro de clientes",
    desc: "Histórico de compras, datas especiais e preferências. Ofereça o atendimento que fideliza.",
    icon: Users,
    bg: "hsl(var(--warning) / .16)",
    fg: "hsl(32 60% 38%)",
  },
];

export interface InsideRow {
  badge: string;
  title: string;
  desc: string;
  bullets: string[];
}

/** 5 linhas do "Por dentro do Floreei" (texto; o mock é JSX próprio). */
export const insideRows: InsideRow[] = [
  {
    badge: "Orçamentos & propostas",
    title: "Orçamentos que viram venda sozinhos",
    desc: "Monte propostas bonitas em minutos e acompanhe cada uma até o fechamento — sem retrabalho.",
    bullets: [
      "Modelos prontos por tipo de arranjo e de evento",
      "Itens puxados do seu catálogo, com preço e foto",
      "Envio por WhatsApp e aprovação com um clique do cliente",
      "Ao aprovar, vira venda e dá baixa no estoque automaticamente",
    ],
  },
  {
    badge: "Agenda & eventos",
    title: "Nenhuma entrega esquecida",
    desc: "Casamentos, aniversários e corporativos organizados por data, com tudo que cada evento precisa.",
    bullets: [
      "Todos os eventos num calendário só, por dia e semana",
      "Checklist de montagem e entrega para cada evento",
      "Responsáveis e equipe definidos por data",
      "Lembretes de prazo para não perder nenhuma entrega",
    ],
  },
  {
    badge: "Estoque & compras",
    title: "Saiba o que tem e o que falta",
    desc: "Controle o que é perecível, evite desperdício e compre na hora certa — com margem clara em cada produto.",
    bullets: [
      "Entrada de mercadoria e cadastro de fornecedores",
      "Alerta de flores perecíveis e de itens acabando",
      "Baixa automática a cada venda registrada",
      "Custo por produto para você enxergar sua margem",
    ],
  },
  {
    badge: "Clientes & relatórios",
    title: "Clientes fiéis e decisões com números",
    desc: "Conheça quem compra com você e feche o mês sabendo o que vendeu, para quem e como.",
    bullets: [
      "Histórico de compras e preferências de cada cliente",
      "Lembretes de datas especiais para fidelizar",
      "Relatórios de vendas, produtos e clientes",
      "Painel com a saúde do negócio sempre à mão",
    ],
  },
  {
    badge: "Notas & pedidos",
    title: "Nota e pedido emitidos em segundos",
    desc: "Feche a venda com o documento no ponto — sem redigitar nada em outro sistema. O pedido e a nota saem direto do que você já lançou.",
    bullets: [
      "Emissão de NF-e e NFC-e direto da venda ou do evento",
      "Pedido de venda gerado a partir do orçamento aprovado",
      "Dados do cliente e itens preenchidos automaticamente",
      "Envio da nota e do pedido por WhatsApp ou e-mail",
    ],
  },
];

export const steps = [
  {
    n: "1",
    title: "Fale com a gente",
    desc: "Um clique no WhatsApp e nossa equipe entende o seu tipo de floricultura.",
  },
  {
    n: "2",
    title: "Configuramos com você",
    desc: "Ajudamos a cadastrar seus produtos e preços dentro da plataforma — o sistema já entra configurado e pronto pra usar.",
  },
  {
    n: "3",
    title: "Sua equipe entra",
    desc: "Telas simples e treinamento rápido. Todo mundo aprende no primeiro dia.",
  },
  {
    n: "4",
    title: "Você acompanha tudo",
    desc: "Orçamentos, vendas e caixa organizados. Você decide com números na mão.",
  },
];

/** Placeholder — substituir por depoimentos reais. */
export const testimonials = [
  {
    quote:
      "Saí do caderno e das planilhas soltas. Hoje sei exatamente o que vendi e o que tenho para receber.",
    initials: "MF",
    name: "Marta Fontes",
    role: "Floricultura Bem-Me-Quer",
    bg: "hsl(var(--primary))",
  },
  {
    quote:
      "Para eventos foi um divisor de águas. Cada casamento com seu orçamento, prazo e financeiro no lugar.",
    initials: "RC",
    name: "Rafael Campos",
    role: "Campos Decorações",
    bg: "hsl(var(--clay))",
  },
  {
    quote:
      "A equipe aprendeu em um dia. E o suporte responde de verdade, em português, quando eu preciso.",
    initials: "JS",
    name: "Juliana Souza",
    role: "Ateliê Flor de Lis",
    bg: "hsl(var(--chart-3))",
  },
];

// Os planos exibidos na seção de preços vêm da API (planos vigentes, editáveis
// pelo console) com fallback para PLAN_TIER_LIST de @sistema-flores/types —
// ver components/landing/plans.tsx.

export const faqData = [
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O Floreei funciona direto no navegador, no computador, tablet ou celular. Você recebe um acesso e já pode começar.",
  },
  {
    q: "Quanto custa?",
    a: "Os planos partem de R$ 79/mês, já com 1 acesso incluso; cada pessoa a mais na equipe custa R$ 16/mês. Você paga pelos recursos que precisa e pelo tamanho do seu time. Antes de pagar qualquer coisa, testa tudo grátis por 7 dias, sem cartão.",
  },
  {
    q: "Serve para decoração de eventos, não só loja?",
    a: "Sim. Além do balcão, o sistema tem agenda de eventos, orçamentos por evento e financeiro separado — pensado para casamentos, aniversários e corporativos.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Ficam. Seus dados são armazenados com backup automático e acesso protegido. Você controla quem da equipe vê o quê.",
  },
  {
    q: "Tenho que assinar contrato de fidelidade?",
    a: "Não há fidelidade. Você tem 7 dias grátis para testar e pode cancelar quando quiser, sem multa.",
  },
  {
    q: "Vocês ajudam na configuração inicial?",
    a: "Sim. Nossa equipe configura o sistema com os seus produtos e preços e faz um treinamento rápido com você e sua equipe.",
  },
];

/** Itens da composição do custo (módulo de formação de preço). custoTotal = 83,50. */
export const custoRaw = [
  { name: "Rosas colombianas · 12un", val: 42 },
  { name: "Folhagens e complementos", val: 14 },
  { name: "Papel e embalagem", val: 9.5 },
  { name: "Mão de obra (montagem)", val: 18 },
];
