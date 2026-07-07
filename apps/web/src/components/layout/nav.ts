import type { Feature } from "@sistema-flores/types";
import {
  BarChart3,
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
}

export const navGroups: NavGroup[] = [
  {
    label: "Dia a dia",
    items: [
      { label: "Início", href: "/inicio", icon: Home },
      { label: "Vendas", href: "/eventos", icon: CalendarHeart, feature: "SALES" },
      {
        label: "Pedidos da loja",
        href: "/pedidos-loja",
        icon: ShoppingBag,
        feature: "STORE",
      },
      { label: "Caixa", href: "/caixa", icon: Coins, feature: "SALES" },
      { label: "Clientes", href: "/clientes", icon: Users },
    ],
  },
  {
    label: "Suprimentos",
    items: [
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
    label: "Gestão",
    items: [
      { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
      { label: "Orçamentos", href: "/orcamentos", icon: FileText, feature: "QUOTES" },
      { label: "Financeiro", href: "/financeiro", icon: Wallet, feature: "FINANCE" },
      { label: "Despesas", href: "/despesas", icon: Receipt, feature: "FINANCE" },
      {
        label: "Relatórios",
        href: "/relatorios",
        icon: BarChart3,
        feature: "REPORTS",
      },
      { label: "Catálogo", href: "/catalogo", icon: Sprout },
      { label: "Buquês", href: "/buques", icon: Flower, feature: "ARRANGEMENTS" },
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

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
