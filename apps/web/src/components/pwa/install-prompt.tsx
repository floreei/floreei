"use client";

import { Share, SquarePlus, Smartphone, X } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Evento do Chrome/Android — não existe nos tipos do DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "floreei:install-dismissed";

// Captura GLOBAL: o beforeinstallprompt dispara uma única vez, cedo — guarda o
// evento no módulo para qualquer componente usar depois (card, menu "Mais").
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    subscribers.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    subscribers.forEach((fn) => fn());
  });
}

interface InstallState {
  /** Dá pra oferecer instalação neste dispositivo/navegador? */
  available: boolean;
  /** iOS: sem prompt programático — mostramos o passo a passo. */
  isIos: boolean;
  /** Dispara o prompt nativo (Android/Chrome). */
  install: () => Promise<void>;
}

export function useInstallPrompt(): InstallState {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    subscribers.add(rerender);
    setReady(true); // evita mismatch de hidratação (só decide no cliente)
    return () => {
      subscribers.delete(rerender);
    };
  }, []);

  if (!ready) return { available: false, isIos: false, install: async () => {} };

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS antigo expõe navigator.standalone
    (navigator as { standalone?: boolean }).standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return {
    available: !standalone && (Boolean(deferredPrompt) || isIos),
    isIos: isIos && !deferredPrompt,
    install: async () => {
      if (!deferredPrompt) return;
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      subscribers.forEach((fn) => fn());
    },
  };
}

/** Passo a passo do iOS (Safari não tem prompt de instalação programático). */
function IosInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Instalar o Floreei</DialogTitle>
          <DialogDescription>
            No iPhone, a instalação é feita pelo Safari em dois toques:
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Share className="h-4 w-4" />
            </span>
            <span className="pt-1.5">
              Toque em <strong>Compartilhar</strong> na barra do Safari
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SquarePlus className="h-4 w-4" />
            </span>
            <span className="pt-1.5">
              Escolha <strong>Adicionar à Tela de Início</strong> e confirme
            </span>
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          O Floreei aparece na tela inicial e abre em tela cheia, como um app.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Card dispensável no Início (celular): convida a instalar o app. Android abre
 * o prompt nativo; iOS mostra o passo a passo. Some quando já está instalado.
 */
export function InstallPromptCard() {
  const { available, isIos, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    setDismissed(Boolean(localStorage.getItem(DISMISS_KEY)));
  }, []);

  if (!available || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 lg:hidden">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Smartphone className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instale o Floreei no celular</p>
        <p className="text-xs text-muted-foreground">
          Abra direto da tela inicial, em tela cheia — sem loja de aplicativos.
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0"
        onClick={() => (isIos ? setIosOpen(true) : install())}
      >
        Instalar
      </Button>
      <button
        type="button"
        aria-label="Dispensar"
        onClick={dismiss}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </div>
  );
}

/** Item "Instalar o app" para o menu Mais (drawer da bottom nav). */
export function InstallMenuItem({ onNavigate }: { onNavigate?: () => void }) {
  const { available, isIos, install } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);

  if (!available) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isIos) {
            setIosOpen(true);
          } else {
            void install();
            onNavigate?.();
          }
        }}
        className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary"
      >
        <Smartphone className="h-4 w-4" />
        Instalar o app no celular
      </button>
      <IosInstallDialog
        open={iosOpen}
        onOpenChange={(o) => {
          setIosOpen(o);
          if (!o) onNavigate?.();
        }}
      />
    </>
  );
}
