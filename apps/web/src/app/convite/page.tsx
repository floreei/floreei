"use client";

import type { InviteInfo } from "@sistema-flores/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

export default function ConvitePage() {
  return (
    <Suspense fallback={<Centered>Carregando…</Centered>}>
      <ConviteInner />
    </Suspense>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      {children}
    </div>
  );
}

function ConviteInner() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { login } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    api
      .get<InviteInfo>(`/auth/invite/${token}`)
      .then((i) => {
        setInfo(i);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [token]);

  if (state === "loading") return <Centered>Carregando convite…</Centered>;

  if (state === "invalid" || !info) {
    return (
      <Centered>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Convite inválido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Este convite não existe ou já foi utilizado. Peça um novo link a
              quem te convidou.
            </p>
            <Button variant="outline" onClick={() => router.replace("/login")}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </Centered>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post<{ email: string }>("/auth/accept-invite", {
        token,
        password,
      });
      await login({ email: info.email, password });
      router.replace("/inicio");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Não foi possível aceitar o convite.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Centered>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Bem-vindo(a) ao Floreei
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Você foi convidado(a) para{" "}
            <strong>{info.companyName || "uma equipe"}</strong>. Defina sua senha
            para acessar como <strong>{info.email}</strong>.
          </p>
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="Crie uma senha" htmlFor="inv-pass" required>
              <Input
                id="inv-pass"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ao menos 8 caracteres"
              />
            </Field>
            <Button type="submit" className="w-full" loading={submitting}>
              Definir senha e entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </Centered>
  );
}
