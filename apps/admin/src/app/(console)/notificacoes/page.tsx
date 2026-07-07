"use client";

import type { PlatformNotificationsResult } from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.get<PlatformNotificationsResult>("/admin/notifications"),
  });

  // Ao abrir a página, marca tudo como lido e zera o badge do menu.
  const markRead = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/admin/notifications/read"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const hasUnread = (data?.unread ?? 0) > 0;
  useEffect(() => {
    if (hasUnread && !markRead.isPending) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnread]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold">Notificações</h1>
        <p className="text-muted-foreground">
          Novos cadastros e eventos da plataforma.
        </p>
      </header>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Bell className="h-6 w-6" />
            <p>Nenhuma notificação por enquanto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((n) => {
            const inner = (
              <CardContent className="flex items-start gap-3 py-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(n.createdAt)}
                </span>
              </CardContent>
            );
            return n.companyId ? (
              <Link key={n.id} href={`/empresas/${n.companyId}`}>
                <Card className="transition-colors hover:border-primary/40">
                  {inner}
                </Card>
              </Link>
            ) : (
              <Card key={n.id}>{inner}</Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
