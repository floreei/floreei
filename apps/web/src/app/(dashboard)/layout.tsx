"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccessBlocked } from "@/components/auth/access-blocked";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { FeatureUpsell } from "@/components/billing/feature-upsell";
import { CommandPaletteProvider } from "@/components/layout/command-palette";
import { navItems, navItemUnlocked } from "@/components/layout/nav";
import { PaymentBanner } from "@/components/layout/payment-banner";
import { SidebarNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TrialBanner } from "@/components/layout/trial-banner";
import { useAuth } from "@/lib/auth/auth-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, ready, blocked, awaitingVerification } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !user && !blocked && !awaitingVerification) {
      router.replace("/login");
    }
  }, [ready, user, blocked, awaitingVerification, router]);

  if (ready && awaitingVerification) {
    return <VerifyEmailScreen email={awaitingVerification.email} />;
  }

  if (ready && blocked) {
    return <AccessBlocked blocked={blocked} />;
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Módulo fora do plano: mostra o convite de upgrade no lugar da página.
  // (A API também bloqueia com 403 FEATURE_LOCKED — aqui é só a experiência.)
  const navItem = navItems.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  const lockedFeature =
    navItem && !navItemUnlocked(navItem, user.access?.features)
      ? navItem.feature
      : undefined;

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-muted/20">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:block">
          <SidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TrialBanner />
          <PaymentBanner />
          <Topbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {lockedFeature ? <FeatureUpsell feature={lockedFeature} /> : children}
          </main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
