"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Paginated } from "@sistema-flores/types";

/** Paginação simples (Anterior/Próxima + "Página X de Y") para listas. */
export function Pagination({
  data,
  onPageChange,
}: {
  data: Pick<Paginated<unknown>, "page" | "totalPages" | "total"> | undefined;
  onPageChange: (page: number) => void;
}) {
  if (!data || data.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-1 py-3">
      <p className="text-sm text-muted-foreground">
        Página {data.page} de {data.totalPages} · {data.total}{" "}
        {data.total === 1 ? "resultado" : "resultados"}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={data.page <= 1}
          onClick={() => onPageChange(data.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={data.page >= data.totalPages}
          onClick={() => onPageChange(data.page + 1)}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
