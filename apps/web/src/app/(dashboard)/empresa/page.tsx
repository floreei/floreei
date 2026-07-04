"use client";

import { companySettingsSchema } from "@sistema-flores/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { useCompany, useUpdateCompany } from "@/lib/api/company";
import { useAuth } from "@/lib/auth/auth-context";
import { maskCpfCnpj, maskPhone, withMask } from "@/lib/masks";

const MAX_LOGO_BYTES = 1_500_000; // ~1,5 MB

export default function CompanyPage() {
  const { data, isLoading } = useCompany();
  const update = useUpdateCompany();
  const { patchUser } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      document: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        document: data.document ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        address: data.address ?? "",
      });
      setLogo(data.logo ?? null);
    }
  }, [data, form]);

  const onPickLogo = (file: File) => {
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Imagem muito grande. Use até ~1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dados da empresa"
        description="Preencha o que quiser — o que estiver preenchido sai na nota do orçamento."
      />

      <form
        className="grid gap-6 lg:grid-cols-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const saved = await update.mutateAsync({ ...values, logo });
            patchUser({ companyName: saved.name });
            toast.success("Dados salvos.");
          } catch (error) {
            toast.error(
              error instanceof ApiError ? error.message : "Erro ao salvar.",
            );
          }
        })}
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome da empresa" htmlFor="c-name" required error={form.formState.errors.name?.message}>
              <Input id="c-name" {...form.register("name")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CNPJ / CPF" htmlFor="c-doc" optional>
                <Input
                  id="c-doc"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  {...withMask(maskCpfCnpj, form.register("document"))}
                />
              </Field>
              <Field label="Telefone" htmlFor="c-phone" optional>
                <Input
                  id="c-phone"
                  inputMode="numeric"
                  placeholder="(11) 91234-5678"
                  {...withMask(maskPhone, form.register("phone"))}
                />
              </Field>
            </div>
            <Field label="E-mail" htmlFor="c-email" optional error={form.formState.errors.email?.message}>
              <Input id="c-email" type="email" {...form.register("email")} />
            </Field>
            <Field label="Endereço" htmlFor="c-address" optional>
              <Input id="c-address" placeholder="Rua, número, bairro, cidade" {...form.register("address")} />
            </Field>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Logo da empresa" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-sm text-muted-foreground">Sem logo</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickLogo(file);
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                {logo ? "Trocar" : "Enviar logo"}
              </Button>
              {logo ? (
                <Button type="button" variant="ghost" onClick={() => setLogo(null)} aria-label="Remover logo">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Use uma imagem quadrada (PNG ou JPG), fundo transparente de
              preferência, até ~1,5 MB. Ela aparece no topo da nota do orçamento.
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Button type="submit" loading={form.formState.isSubmitting}>
            Salvar dados
          </Button>
        </div>
      </form>
    </div>
  );
}
