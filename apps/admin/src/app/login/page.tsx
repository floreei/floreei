"use client";

import { Flower2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const { session, ready, deniedEmail, login, loginWithGoogle, logout } =
    useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (ready && session) router.replace("/");
  }, [ready, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao entrar com Google.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flower2 className="h-6 w-6" />
          </div>
          <p className="eyebrow">Console do gestor</p>
          <h1 className="font-serif text-2xl font-semibold">Floreei</h1>
        </div>

        {deniedEmail ? (
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-card">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deniedEmail}</span>{" "}
              não faz parte da equipe de gestores. Peça a um gestor para liberar
              seu acesso.
            </p>
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              Usar outra conta
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-card">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@floreei.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" loading={submitting}>
                Entrar
              </Button>
            </form>

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              loading={googleLoading}
              onClick={handleGoogle}
            >
              Continuar com Google
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Acesso restrito à equipe da plataforma.
        </p>
      </div>
    </div>
  );
}
