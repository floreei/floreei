"use client";

import { storeSettingsSchema } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ExternalLink, Store } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { useCompany, useStoreSettings, useUpdateStoreSettings } from "@/lib/api/company";

const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_STORE_BASE_DOMAIN ?? "floreei.com.br";

type FormValues = {
  slug: string;
  enabled: boolean;
  primaryColor: string;
  accentColor: string;
  headline: string;
  description: string;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;
};

export default function StorePage() {
  const { data: store, isLoading } = useStoreSettings();
  const { data: company } = useCompany();
  const update = useUpdateStoreSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      slug: "",
      enabled: false,
      primaryColor: "#2F6050",
      accentColor: "#C6795B",
      headline: "",
      description: "",
      mercadoPagoPublicKey: "",
      mercadoPagoAccessToken: "",
    },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        slug: store.slug ?? "",
        enabled: store.enabled,
        primaryColor: store.primaryColor,
        accentColor: store.accentColor,
        headline: store.headline ?? "",
        description: store.description ?? "",
        mercadoPagoPublicKey: store.mercadoPagoPublicKey ?? "",
        mercadoPagoAccessToken: "",
      });
    }
  }, [store, form]);

  const slug = form.watch("slug");
  const primary = form.watch("primaryColor");
  const accent = form.watch("accentColor");
  const headline = form.watch("headline");
  const enabled = form.watch("enabled");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const storeUrl = slug ? `https://${slug}.${BASE_DOMAIN}` : null;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await update.mutateAsync({
            ...values,
            // token vazio = não altera (write-only)
            mercadoPagoAccessToken: values.mercadoPagoAccessToken || undefined,
          });
          toast.success("Loja atualizada.");
          form.setValue("mercadoPagoAccessToken", "");
        } catch (error) {
          toast.error(
            error instanceof ApiError ? error.message : "Não foi possível salvar.",
          );
        }
      })}
    >
      <PageHeader
        title="Loja online"
        description="Sua vitrine para vender buquês, cestas e kits pela internet."
      >
        {storeUrl && store?.enabled ? (
          <Button asChild variant="outline" type="button">
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Abrir loja
            </a>
          </Button>
        ) : null}
        <Button type="submit" loading={form.formState.isSubmitting}>
          Salvar
        </Button>
      </PageHeader>

      {/* Preview ao vivo */}
      <Card>
        <CardContent className="p-0">
          <div
            className="flex flex-col items-center gap-3 rounded-t-xl px-6 py-10 text-center"
            style={{ backgroundColor: primary }}
          >
            {company?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo}
                alt=""
                className="h-16 w-16 rounded-2xl bg-white/90 object-contain p-1"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Store className="h-8 w-8" />
              </span>
            )}
            <p className="font-serif text-2xl font-semibold text-white">
              {company?.name ?? "Sua floricultura"}
            </p>
            {headline ? (
              <p className="max-w-md text-sm text-white/85">{headline}</p>
            ) : null}
            <span
              className="mt-1 rounded-full px-5 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              Comprar agora
            </span>
          </div>
          <p className="px-6 py-3 text-center text-xs text-muted-foreground">
            Prévia da sua loja — atualiza conforme você edita as cores e o texto.
          </p>
        </CardContent>
      </Card>

      {/* Endereço + status */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço e status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Endereço da loja"
            htmlFor="slug"
            error={form.formState.errors.slug?.message}
            hint="Letras minúsculas, números e hífen. É o subdomínio da sua loja."
          >
            <div className="flex items-center gap-2">
              <Input
                id="slug"
                placeholder="minha-floricultura"
                className="max-w-[220px]"
                {...form.register("slug")}
              />
              <span className="text-sm text-muted-foreground">.{BASE_DOMAIN}</span>
            </div>
          </Field>

          <label className="flex items-center justify-between gap-4 rounded-lg border border-border/70 p-4">
            <div>
              <p className="text-sm font-medium">Loja ativa</p>
              <p className="text-xs text-muted-foreground">
                Quando ativa, sua loja fica no ar para os clientes comprarem.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 shrink-0 accent-primary"
              {...form.register("enabled")}
            />
          </label>
          {enabled && !slug ? (
            <p className="text-xs font-medium text-destructive">
              Defina o endereço da loja antes de ativá-la.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Cor principal"
              name="primaryColor"
              control={form.control}
              value={primary}
            />
            <ColorField
              label="Cor de destaque"
              name="accentColor"
              control={form.control}
              value={accent}
            />
          </div>
          <Field
            label="Frase de destaque"
            htmlFor="headline"
            hint="Aparece no topo da loja (ex.: 'Flores frescas, entrega no mesmo dia')."
          >
            <Input
              id="headline"
              placeholder="Flores frescas para todos os momentos"
              {...form.register("headline")}
            />
          </Field>
          <Field label="Descrição" htmlFor="description">
            <textarea
              id="description"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-[var(--shadow-xs)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Conte um pouco sobre a sua floricultura."
              {...form.register("description")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamento (Mercado Pago)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Conecte sua conta Mercado Pago para receber Pix e cartão direto na sua
            conta. Pegue as chaves no painel de desenvolvedor do Mercado Pago.
          </p>
          {store?.mercadoPagoConnected ? (
            <p className="inline-flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Conta conectada
            </p>
          ) : null}
          <Field label="Public key" htmlFor="mp-pk">
            <Input
              id="mp-pk"
              placeholder="APP_USR-..."
              {...form.register("mercadoPagoPublicKey")}
            />
          </Field>
          <Field
            label="Access token"
            htmlFor="mp-at"
            hint={
              store?.mercadoPagoConnected
                ? "Já configurado. Preencha só para substituir."
                : "Guardado de forma segura (criptografado)."
            }
          >
            <Input
              id="mp-at"
              type="password"
              placeholder="APP_USR-..."
              autoComplete="off"
              {...form.register("mercadoPagoAccessToken")}
            />
          </Field>
        </CardContent>
      </Card>
    </form>
  );
}

function ColorField({
  label,
  name,
  control,
  value,
}: {
  label: string;
  name: "primaryColor" | "accentColor";
  control: ReturnType<typeof useForm<FormValues>>["control"];
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-background p-1"
              value={value}
              onChange={(e) => field.onChange(e.target.value)}
              aria-label={label}
            />
            <Input
              id={name}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="max-w-[130px] font-mono uppercase"
            />
          </div>
        )}
      />
    </div>
  );
}
