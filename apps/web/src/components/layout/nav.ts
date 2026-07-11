import type { Feature, SalesChannel } from "@sistema-flores/types";
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarHeart,
  Coins,
  CreditCard,
  FileText,
  Flower,
  Home,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingBasket,
  Sprout,
  Store,
  Truck,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Módulo pago: some feature do plano → item com cadeado + página de upgrade. */
  feature?: Feature;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  /** Grupo de um canal específico — some do menu quando o foco é o outro canal. */
  channel?: SalesChannel;
}

export const navGroups: NavGroup[] = [
  {
    label: "Dia a dia",
    items: [
      { label: "Início", href: "/inicio", icon: Home },
      { label: "Caixa", href: "/caixa", icon: Coins, feature: "SALES" },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Financeiro", href: "/financeiro", icon: Wallet, feature: "FINANCE" },
      { label: "Despesas", href: "/despesas", icon: Receipt, feature: "FINANCE" },
    ],
  },
  {
    // A base do negócio (o onboarding manda "comece pela base: insumos").
    label: "Insumos e estoque",
    items: [
      { label: "Insumos", href: "/insumos", icon: Sprout },
      {
        label: "Compras",
        href: "/compras",
        icon: ShoppingBasket,
        feature: "INVENTORY",
      },
      { label: "Estoque", href: "/estoque", icon: Package, feature: "INVENTORY" },
      {
        label: "Fornecedores",
        href: "/fornecedores",
        icon: Truck,
        feature: "INVENTORY",
      },
    ],
  },
  {
    label: "Varejo",
    channel: "RETAIL",
    items: [
      { label: "Vendas", href: "/vendas", icon: CalendarHeart, feature: "SALES" },
      // Orçamento é ferramenta de venda (vira venda com 1 clique) → aqui.
      { label: "Orçamentos", href: "/orcamentos", icon: FileText, feature: "QUOTES" },
      { label: "Buquês", href: "/buques", icon: Flower, feature: "ARRANGEMENTS" },
      {
        label: "Pedidos da loja",
        href: "/pedidos-loja",
        icon: ShoppingBag,
        feature: "STORE",
      },
    ],
  },
  {
    label: "Atacado",
    channel: "WHOLESALE",
    items: [
      {
        label: "Vendas no atacado",
        href: "/atacado",
        icon: Boxes,
        feature: "WHOLESALE",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Relatórios",
        href: "/relatorios",
        icon: BarChart3,
        feature: "REPORTS",
      },
      {
        label: "Loja online",
        href: "/loja",
        icon: Store,
        adminOnly: true,
        feature: "STORE",
      },
      { label: "Empresa", href: "/empresa", icon: Building2, adminOnly: true },
      { label: "Equipe", href: "/equipe", icon: UsersRound, adminOnly: true },
      { label: "Plano", href: "/plano", icon: CreditCard, adminOnly: true },
    ],
  },
];

/** Features liberadas → o item está acessível? (sem feature = núcleo, sempre) */
export function navItemUnlocked(
  item: NavItem,
  features: readonly string[] | undefined,
): boolean {
  return !item.feature || (features ?? []).includes(item.feature);
}

/**
 * Grupo visível conforme o foco do negócio: um grupo de canal (Varejo/Atacado)
 * some quando o foco é o outro canal. `BOTH`/indefinido mostra tudo.
 */
export function navGroupVisibleForFocus(
  group: NavGroup,
  focus: SalesChannel | "BOTH" | null | undefined,
): boolean {
  if (!group.channel || !focus || focus === "BOTH") return true;
  return group.channel === focus;
}

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
