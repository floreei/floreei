"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Barra de progresso fina no topo durante a navegação entre telas. Começa ao
 * clicar num link interno (feedback imediato) e completa quando a rota muda —
 * sem depender de eventos de router (App Router não os expõe) nem de lib externa.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const trickle = useRef<ReturnType<typeof setInterval>>();
  const hide = useRef<ReturnType<typeof setTimeout>>();
  const safety = useRef<ReturnType<typeof setTimeout>>();

  const start = () => {
    clearInterval(trickle.current);
    clearTimeout(hide.current);
    clearTimeout(safety.current);
    setActive(true);
    setProgress(12);
    // Sobe em direção a ~90% sem nunca chegar (trickle) até a rota completar.
    trickle.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.6, (90 - p) * 0.08)));
    }, 180);
    // Segurança: se a navegação não completar, esconde sozinho.
    safety.current = setTimeout(complete, 8000);
  };

  const complete = () => {
    clearInterval(trickle.current);
    clearTimeout(safety.current);
    setProgress(100);
    hide.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 240);
  };

  // Completa quando a rota (pathname) muda.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    complete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Começa ao clicar num link interno para outra rota.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return; // mesma tela
        start();
      } catch {
        /* href inválido — ignora */
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearInterval(trickle.current);
      clearTimeout(hide.current);
      clearTimeout(safety.current);
    };
    // start/complete usam só refs e setState (estáveis); o listener monta uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
    >
      <div
        className="h-full bg-primary transition-[width] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 8px hsl(var(--primary) / 0.7)",
        }}
      />
    </div>
  );
}
