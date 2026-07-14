"use client";

import type { AccountOption } from "@sistema-flores/types";
import {
  ArrowLeftRight,
  Building2,
  Check,
  HelpCircle,
  LogOut,
  Search,
  Store,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AssistantLauncher } from "@/components/assistant/assistant-launcher";
import { FocusChooser } from "@/components/onboarding/focus-chooser";
import { useGuide } from "@/components/onboarding/guide";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useBusinessFocus } from "@/lib/onboarding/focus";
import { useCommandPalette } from "./command-palette";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Topbar() {
  const { user, logout, loadAccounts, selectAccount } = useAuth();
  const { open } = useCommandPalette();
  const guide = useGuide();
  const { focus, choose } = useBusinessFocus();
  const [focusOpen, setFocusOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOption[] | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const openSwitch = async () => {
    setSwitchOpen(true);
    setAccounts(null);
    try {
      setAccounts(await loadAccounts());
    } catch {
      setAccounts([]);
    }
  };

  const switchTo = async (companyId: string) => {
    if (companyId === user?.companyId) {
      setSwitchOpen(false);
      return;
    }
    setSwitchingId(companyId);
    try {
      await selectAccount(companyId);
      setSwitchOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível trocar.",
      );
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* No mobile a navegação vive na bottom bar ("Mais" abre o menu completo). */}
      <button
        type="button"
        onClick={open}
        className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:max-w-xs"
      >
        <Search className="h-4 w-4" />
        <span>Buscar…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <AssistantLauncher />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={guide.open}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Ajuda</span>
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar>
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFocusOpen(true)}>
                <Store className="h-4 w-4" />
                Como você vende?
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openSwitch}>
                <ArrowLeftRight className="h-4 w-4" />
                Trocar de conta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Dialog open={focusOpen} onOpenChange={setFocusOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <div className="space-y-1 text-center">
              <DialogTitle className="font-serif text-2xl">
                Como você vende?
              </DialogTitle>
              <DialogDescription>
                Ajusta seu menu: mostra só o canal que você usa (Varejo e/ou
                Atacado).
              </DialogDescription>
            </div>
            <FocusChooser
              value={focus ?? null}
              onChoose={(f) => {
                choose(f);
                setFocusOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent className="max-w-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <DialogTitle className="font-serif text-xl">
                Trocar de conta
              </DialogTitle>
              <DialogDescription>
                Escolha a empresa que você quer acessar.
              </DialogDescription>
            </div>
            <div className="space-y-2">
              {accounts === null ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Carregando…
                </p>
              ) : accounts.length <= 1 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Você só tem esta conta.
                </p>
              ) : (
                accounts.map((a) => {
                  const current = a.companyId === user?.companyId;
                  return (
                    <button
                      key={a.companyId}
                      type="button"
                      disabled={switchingId !== null}
                      onClick={() => switchTo(a.companyId)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {a.companyName || "Empresa"}
                      </span>
                      {current ? (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
