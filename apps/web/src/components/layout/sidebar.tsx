"use client";

import { Flower2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "./nav";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex h-full flex-col gap-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-4 py-4"
        onClick={onNavigate}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Flower2 className="h-5 w-5" />
        </span>
        <span className="line-clamp-2 font-serif text-lg font-semibold leading-tight tracking-tight">
          {user?.companyName ?? "Sistema Flores"}
        </span>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => {
          const items = group.items.filter(
            (item) => !item.adminOnly || user?.role === "ADMIN",
          );
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground/70 group-hover:text-foreground",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
