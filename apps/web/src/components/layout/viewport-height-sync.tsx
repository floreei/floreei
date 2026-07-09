"use client";

import { useEffect } from "react";

/**
 * Mantém `--vvh` = altura REALMENTE visível (visualViewport). Diferente de
 * 100dvh, desconta o teclado virtual — dialogs/CTAs param acima do teclado e
 * o conteúdo rola até o fim. Sem visualViewport (raro), fica o fallback CSS.
 */
export function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--vvh");
    };
  }, []);
  return null;
}
