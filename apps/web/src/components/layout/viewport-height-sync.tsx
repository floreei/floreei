"use client";

import { useEffect } from "react";

/**
 * Sincroniza o visualViewport em variáveis CSS para os dialogs fullscreen:
 * - `--vvh`: altura REALMENTE visível (desconta o teclado virtual).
 * - `--vv-top`: deslocamento do topo visível. No iOS, quando o campo focado
 *   está no meio de um form rolável, o Safari rola o visual viewport pra cima
 *   (offsetTop > 0). Um `position: fixed` é ancorado no LAYOUT viewport e não
 *   acompanha isso — sem esse offset o dialog fica cortado no topo e sobra
 *   fundo entre ele e o teclado. Ancorando o dialog em `top: var(--vv-top)`
 *   ele volta a ocupar exatamente a janela visível.
 * Sem visualViewport (raro), fica o fallback CSS (--vvh: 100dvh; --vv-top: 0).
 */
export function ViewportHeightSync() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--vvh", `${vv.height}px`);
      root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      // Teclado aberto (viewport visível bem menor que a janela): elementos
      // com data-kb-hide somem para o formulário ganhar a tela toda.
      const keyboardOpen = vv.height < window.innerHeight - 140;
      root.classList.toggle("kb-open", keyboardOpen);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vv-top");
      root.classList.remove("kb-open");
    };
  }, []);
  return null;
}
