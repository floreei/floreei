"use client";

import type { ReviewStatus } from "@sistema-flores/types";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  useDeleteReview,
  useReviews,
  useSetReviewStatus,
} from "@/lib/api/reviews";
import { cn, formatDate } from "@/lib/utils";

const filters: [ReviewStatus | undefined, string][] = [
  [undefined, "Todas"],
  ["APPROVED", "Aprovadas"],
  ["HIDDEN", "Ocultas"],
];

function stars(rating: number) {
  return "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
}

/** Moderação das avaliações da loja: ocultar/reexibir e excluir comentários. */
export function ReviewsCard() {
  const [status, setStatus] = useState<ReviewStatus | undefined>();
  const { data, isLoading } = useReviews({ status });
  const setStatusMut = useSetReviewStatus();
  const del = useDeleteReview();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const toggle = async (id: string, next: ReviewStatus) => {
    try {
      await setStatusMut.mutateAsync({ id, status: next });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Erro ao salvar.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Avaliações</CardTitle>
        <div className="flex gap-1.5">
          {filters.map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data || data.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma avaliação {status === "HIDDEN" ? "oculta" : "por aqui"} ainda.
          </p>
        ) : (
          data.data.map((r) => (
            <div
              key={r.id}
              className={cn(
                "rounded-lg border border-border/70 p-3",
                r.status === "HIDDEN" && "opacity-60",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{r.authorName}</span>
                <span className="text-sm text-amber-500" aria-label={`${r.rating} de 5`}>
                  {stars(r.rating)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.arrangementName ?? "—"} · {formatDate(r.createdAt.slice(0, 10))}
                </span>
                {r.source === "SEED" ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    semeada
                  </span>
                ) : null}
                {r.status === "HIDDEN" ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    oculta
                  </span>
                ) : null}
              </div>
              {r.comment ? (
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggle(r.id, r.status === "APPROVED" ? "HIDDEN" : "APPROVED")
                  }
                >
                  {r.status === "APPROVED" ? "Ocultar" : "Reexibir"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setToDelete(r.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir avaliação"
        description="A avaliação será removida permanentemente."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!toDelete) return;
          await del.mutateAsync(toDelete);
          toast.success("Avaliação excluída.");
          setToDelete(null);
        }}
      />
    </Card>
  );
}
