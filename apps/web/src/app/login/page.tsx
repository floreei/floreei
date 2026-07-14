"use client";

import { loginSchema, registerSchema } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flower2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AccountPicker } from "@/components/auth/account-picker";
import { FinishSetupDialog } from "@/components/auth/finish-setup-dialog";
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { GoogleIcon } from "@/components/auth/google-icon";
import { VerifyEmailScreen } from "@/components/auth/verify-email-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/shared/field";
import { useAuth } from "@/lib/auth/auth-context";
import { maskCpfCnpj, withMask } from "@/lib/masks";

export default function LoginPage() {
  const {
    login,
    register: registerUser,
    loginWithGoogle,
    logout,
    pendingProvision,
    awaitingVerification,
    accountSelection,
    selectAccount,
    user,
    ready,
  } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Prefetch da home para encurtar a transição pós-login.
  useEffect(() => {
    router.prefetch("/inicio");
  }, [router]);

  useEffect(() => {
    if (ready && user) router.replace("/inicio");
  }, [ready, user, router]);

  // Autenticado: mostramos a transição até a home montar (evita tela "travada").
  const redirecting = ready && Boolean(user);

  // E-mail ainda não verificado: pede a verificação antes de qualquer coisa.
  if (ready && awaitingVerification) {
    return <VerifyEmailScreen email={awaitingVerification.email} />;
  }

  // E-mail em mais de uma empresa: escolhe qual antes de entrar.
  if (ready && !user && accountSelection) {
    return (
      <AccountPicker
        accounts={accountSelection}
        onSelect={selectAccount}
        onCancel={logout}
      />
    );
  }

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {redirecting ? <RedirectingOverlay /> : null}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, hsl(var(--clay)) 0, transparent 45%), radial-gradient(circle at 80% 70%, hsl(var(--chart-3)) 0, transparent 40%)",
          }}
        />
        <div className="relative flex items-center gap-2 text-lg font-medium">
          <Flower2 className="h-6 w-6" />
          Floreei
        </div>
        <div className="relative space-y-4">
          <h2 className="font-serif text-4xl font-semibold leading-tight">
            A floricultura inteira, num só lugar.
          </h2>
          <p className="max-w-md text-primary-foreground/80">
            Tudo integrado, com poucos cliques. Produtos, estoque, compras e
            despesas; buquês com custo e preço calculados; vendas, caixa e o
            resultado do mês.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Gestão completa para floriculturas, floristas, atacado e decoração de
          eventos.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center lg:hidden">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Flower2 className="h-6 w-6" />
            </div>
            <h1 className="font-serif text-2xl font-semibold">Floreei</h1>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              loading={googleLoading}
              onClick={handleGoogle}
            >
              {googleLoading ? null : <GoogleIcon className="h-5 w-5" />}
              Continuar com Google
            </Button>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              ou
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {/* Sem redirect manual: o efeito acima navega quando há `user`;
                  se o e-mail tiver >1 conta, mostramos o seletor. */}
              <LoginForm onSubmit={login} />
            </TabsContent>

            <TabsContent value="register">
              <RegisterForm onSubmit={registerUser} />
            </TabsContent>
          </Tabs>

          <FinishSetupDialog pending={pendingProvision} onCancel={logout} />
        </div>
      </main>
    </div>
  );
}

/** Transição de marca enquanto a home carrega — para o pós-login não parecer travado. */
function RedirectingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background/95 backdrop-blur-sm duration-300 animate-in fade-in-0">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/20" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
          <Flower2 className="h-8 w-8" />
        </span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Preparando seu ateliê…
      </p>
    </div>
  );
}

function LoginForm({
  onSubmit,
}: {
  onSubmit: (v: { email: string; password: string }) => Promise<void>;
}) {
  const [forgotOpen, setForgotOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Erro ao entrar.",
          );
        }
      })}
    >
      <Field label="E-mail" htmlFor="login-email" required error={form.formState.errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          placeholder="voce@floricultura.com"
          autoComplete="email"
          {...form.register("email")}
        />
      </Field>
      <Field label="Senha" htmlFor="login-password" required error={form.formState.errors.password?.message}>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...form.register("password")}
        />
      </Field>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => setForgotOpen(true)}
        >
          Esqueci minha senha
        </Button>
      </div>
      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        Entrar
      </Button>
      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={form.getValues("email")}
      />
    </form>
  );
}

function RegisterForm({
  onSubmit,
}: {
  onSubmit: (v: {
    companyName: string;
    name: string;
    document: string;
    email: string;
    password: string;
  }) => Promise<void>;
}) {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      name: "",
      document: "",
      email: "",
      password: "",
    },
  });

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Erro ao criar conta.",
          );
        }
      })}
    >
      <Field label="Nome da empresa" htmlFor="reg-company" required error={form.formState.errors.companyName?.message}>
        <Input id="reg-company" placeholder="Floricultura Bela Flor" {...form.register("companyName")} />
      </Field>
      <Field label="Seu nome" htmlFor="reg-name" required error={form.formState.errors.name?.message}>
        <Input id="reg-name" placeholder="Ana Souza" {...form.register("name")} />
      </Field>
      <Field label="CNPJ ou CPF" htmlFor="reg-document" required error={form.formState.errors.document?.message} hint="Usamos para liberar seu acesso — um cadastro por negócio.">
        <Input id="reg-document" inputMode="numeric" placeholder="00.000.000/0000-00" {...withMask(maskCpfCnpj, form.register("document"))} />
      </Field>
      <Field label="E-mail" htmlFor="reg-email" required error={form.formState.errors.email?.message}>
        <Input id="reg-email" type="email" placeholder="voce@floricultura.com" {...form.register("email")} />
      </Field>
      <Field label="Senha" htmlFor="reg-password" required error={form.formState.errors.password?.message} hint="Mínimo de 8 caracteres.">
        <Input id="reg-password" type="password" placeholder="••••••••" {...form.register("password")} />
      </Field>
      <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
        Criar conta gratuita
      </Button>
    </form>
  );
}
