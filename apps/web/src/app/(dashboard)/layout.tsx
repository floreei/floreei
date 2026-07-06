"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AccessBlocked } from "@/components/auth/access-blocked";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { CommandPaletteProvider } from "@/components/layout/command-palette";
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

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen bg-muted/20">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card lg:block">
          <SidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TrialBanner />
          <Topbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
