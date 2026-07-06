"use client";

import type { PlatformAdminView } from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import { useAdminAuth } from "@/lib/auth/auth-context";

export default function AdminsPage() {
  const { session } = useAdminAuth();
  const qc = useQueryClient();
  const isOwner = session?.role === "OWNER";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admins"],
    queryFn: () => api.get<PlatformAdminView[]>("/admin/admins"),
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"SUPPORT" | "OWNER">("SUPPORT");

  const invite = useMutation({
    mutationFn: () =>
      api.post<PlatformAdminView>("/admin/admins", { email, name, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      setEmail("");
      setName("");
      setRole("SUPPORT");
      toast.success("Gestor convidado. Ele entra com o Firebase no primeiro login.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não foi possível convidar."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/admins/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admins"] });
      toast.success("Gestor removido.");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Não foi possível remover."),
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl font-semibold">Gestores</h1>
        <p className="text-muted-foreground">
          Quem tem acesso a este console.
        </p>
      </header>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convidar gestor</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                invite.mutate();
              }}
            >
              <div className="flex-1 space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="gestor@floreei.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="name"
                  placeholder="Nome do gestor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-sm font-medium">
                  Papel
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "SUPPORT" | "OWNER")}
                  className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm sm:w-40"
                >
                  <option value="SUPPORT">Suporte</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <Button type="submit" loading={invite.isPending}>
                <UserPlus className="h-4 w-4" />
                Convidar
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError || !data ? (
            <p className="p-6 text-sm text-destructive">
              Não foi possível carregar os gestores.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{admin.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {admin.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={admin.role === "OWNER" ? "default" : "secondary"}>
                      {admin.role === "OWNER" ? "Owner" : "Suporte"}
                    </Badge>
                    {isOwner && admin.email !== session?.email ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remover ${admin.name} da equipe de gestores?`,
                            )
                          ) {
                            remove.mutate(admin.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!isOwner ? (
        <p className="text-xs text-muted-foreground">
          Apenas gestores OWNER podem convidar ou remover.
        </p>
      ) : null}
    </div>
  );
}
