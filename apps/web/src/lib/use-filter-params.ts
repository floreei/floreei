"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Filtros de listagem persistidos na URL (query params): sobrevivem ao
 * ir-e-voltar do detalhe e viram link compartilhável. Param ausente cai no
 * default; param presente (mesmo vazio, ex.: "Todo período") prevalece.
 * Escrita via router.replace — sem reload e sem poluir o histórico.
 */
export function useFilterParams(defaults: Record<string, string>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? defaults[key] ?? "",
    [searchParams, defaults],
  );

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  return { get, set };
}
