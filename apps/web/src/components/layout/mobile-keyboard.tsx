"use client";

import { useEffect } from "react";

const MOBILE = "(max-width: 639.98px)";

/**
 * Teclado virtual no mobile — abordagem NATIVA (a única confiável no iOS).
 *
 * Aprendizado caro: tentar dimensionar/reposicionar um `position: fixed` pelo
 * visualViewport (altura/offsetTop) quebra no iOS de várias formas, porque o
 * fixed é ancorado no LAYOUT viewport e o Safari só mexe no VISUAL viewport.
 * O consenso do mercado (e a única coisa que o iOS faz certo por padrão) é:
 * deixar o container em altura fixa (100dvh), rolar o conteúdo nativamente e,
 * ao focar um campo, trazê-lo para o centro com scrollIntoView. Nada de sizing.
 *
 * Este controlador faz só duas coisas, ambas robustas:
 *  1. Marca `kb-open` no <html> quando o teclado sobe (visualViewport encolhe),
 *     para o rodapé fixo (data-kb-hide) sair da frente enquanto se digita.
 *  2. Ao focar um input/textarea dentro de um dialog, rola o campo para o
 *     centro da área visível — acima do teclado — depois que ele termina de subir.
 */
export function MobileKeyboard() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    // 1) Sinal de teclado aberto (encolhimento do visualViewport é confiável).
    const onViewport = () => {
      if (!vv) return;
      root.classList.toggle("kb-open", vv.height < window.innerHeight - 140);
    };
    onViewport();
    vv?.addEventListener("resize", onViewport);
    vv?.addEventListener("scroll", onViewport);

    // 2) Campo focado sempre visível acima do teclado (scroll nativo).
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !window.matchMedia(MOBILE).matches) return;
      const isField =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (!isField || !el.closest('[role="dialog"]')) return;
      // Espera o teclado começar a subir e o viewport assentar, então centraliza.
      window.setTimeout(() => {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 200);
    };
    document.addEventListener("focusin", onFocusIn);

    return () => {
      vv?.removeEventListener("resize", onViewport);
      vv?.removeEventListener("scroll", onViewport);
      document.removeEventListener("focusin", onFocusIn);
      root.classList.remove("kb-open");
    };
  }, []);
  return null;
}
