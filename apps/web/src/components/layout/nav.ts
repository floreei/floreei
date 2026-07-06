import {
  BarChart3,
  Building2,
  CalendarHeart,
  Coins,
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
      { label: "Vendas", href: "/eventos", icon: CalendarHeart },
      { label: "Pedidos da loja", href: "/pedidos-loja", icon: ShoppingBag },
      { label: "Caixa", href: "/caixa", icon: Coins },
      { label: "Clientes", href: "/clientes", icon: Users },
    ],
  },
  {
    label: "Suprimentos",
    items: [
      { label: "Compras", href: "/compras", icon: ShoppingBasket },
      { label: "Estoque", href: "/estoque", icon: Package },
      { label: "Fornecedores", href: "/fornecedores", icon: Truck },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
      { label: "Orçamentos", href: "/orcamentos", icon: FileText },
      { label: "Financeiro", href: "/financeiro", icon: Wallet },
      { label: "Despesas", href: "/despesas", icon: Receipt },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
      { label: "Catálogo", href: "/catalogo", icon: Sprout },
      { label: "Buquês", href: "/buques", icon: Flower },
      { label: "Loja online", href: "/loja", icon: Store, adminOnly: true },
      { label: "Empresa", href: "/empresa", icon: Building2, adminOnly: true },
      { label: "Equipe", href: "/equipe", icon: UsersRound, adminOnly: true },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);
