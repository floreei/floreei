"use client";

import { CalendarHeart, Home, Menu, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuickSale } from "@/components/events/quick-sale-provider";
import { InstallMenuItem } from "@/components/pwa/install-prompt";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./sidebar";

const TABS = [
  { label: "Início", href: "/inicio", icon: Home },
  { label: "Vendas", href: "/eventos", icon: CalendarHeart },
] as const;

const TABS_AFTER = [{ label: "Clientes", href: "/clientes", icon: Users }] as const;

/**
 * Navegação de polegar no celular: as 3 seções mais usadas + "Mais" (menu
 * completo no drawer) e a Venda rápida destacada no centro — a ação nº 1 do
 * dia sempre a um toque. Desktop (lg+) continua com a sidebar.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { openSale } = useQuickSale();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const tabClass = (active: boolean) =>
    cn(
      "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={tabClass(isActive(tab.href))}>
            <tab.icon className="h-5 w-5" strokeWidth={isActive(tab.href) ? 2.4 : 2} />
            {tab.label}
          </Link>
        ))}

        {/* Venda rápida — botão central elevado */}
        <div className="relative">
          <button
            type="button"
            onClick={openSale}
            aria-label="Nova venda"
            className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95 motion-reduce:active:scale-100"
          >
            <Plus className="h-7 w-7" strokeWidth={2.4} />
          </button>
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[11px] font-medium text-muted-foreground">
            Venda
          </span>
        </div>

        {TABS_AFTER.map((tab) => (
          <Link key={tab.href} href={tab.href} className={tabClass(isActive(tab.href))}>
            <tab.icon className="h-5 w-5" strokeWidth={isActive(tab.href) ? 2.4 : 2} />
            {tab.label}
          </Link>
        ))}

        <button type="button" onClick={() => setMoreOpen(true)} className={tabClass(moreOpen)}>
          <Menu className="h-5 w-5" />
          Mais
        </button>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="left" className="flex flex-col p-2">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setMoreOpen(false)} />
          </div>
          <InstallMenuItem onNavigate={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
