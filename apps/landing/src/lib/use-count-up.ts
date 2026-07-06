import { useEffect, useRef, useState } from "react";

export function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Conta de 0 até `target` com easing cubic-out via requestAnimationFrame.
 * Reinicia quando `target` muda; respeita prefers-reduced-motion (vai direto).
 */
export function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    if (prefersReduced()) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);
  return value;
}
