"use client";

import type { PlatformNotificationsResult } from "@sistema-flores/types";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CreditCard,
  Flower2,
  LayoutDashboard,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { useAdminAuth } from "@/lib/auth/auth-context";
import { SHOW_PLANS } from "@/lib/plans-flag";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/empresas", label: "Empresas", icon: Building2 },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  // Módulo de planos oculto por padrão (flag SHOW_PLANS).
  ...(SHOW_PLANS
    ? [{ href: "/planos", label: "Planos", icon: CreditCard }]
    : []),
  { href: "/gestores", label: "Gestores", icon: ShieldCheck },
];

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, ready, deniedEmail, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Contador de não-lidas para o badge do menu (atualiza sozinho).
  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.get<PlatformNotificationsResult>("/admin/notifications"),
    enabled: Boolean(session),
    refetchInterval: 60_000,
  });
  const unread = notifs?.unread ?? 0;

  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, deniedEmail, router]);

  if (!ready || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Flower2 className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Floreei</p>
            <p className="text-xs text-muted-foreground">Console do gestor</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/notificacoes" && unread > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{session.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {session.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <span className="flex items-center gap-2 font-semibold">
            <Flower2 className="h-5 w-5 text-primary" />
            Console
          </span>
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
