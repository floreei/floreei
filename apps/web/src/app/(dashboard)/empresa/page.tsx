"use client";

import { companyFiscalSettingsSchema, companySettingsSchema } from "@sistema-flores/types";
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
import {
  useCompany,
  useCompanyFiscal,
  useUpdateCompany,
  useUpdateCompanyFiscal,
} from "@/lib/api/company";
import { useAuth } from "@/lib/auth/auth-context";
import { maskCpfCnpj, maskPhone, withMask } from "@/lib/masks";

const MAX_LOGO_BYTES = 1_500_000; // ~1,5 MB

export default function CompanyPage() {
  const { data, isLoading } = useCompany();
  const update = useUpdateCompany();
  const { data: fiscal, isLoading: loadingFiscal } = useCompanyFiscal();
  const updateFiscal = useUpdateCompanyFiscal();
  const { patchUser } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fiscalForm = useForm({
    resolver: zodResolver(companyFiscalSettingsSchema),
    defaultValues: {
      stateRegistration: "",
      taxRegime: "",
      addressStreet: "",
      addressNumber: "",
      addressComplement: "",
      addressNeighborhood: "",
      addressCity: "",
      addressState: "",
      addressZip: "",
      cityCode: "",
      invoiceAutoEmit: false,
      environment: "HOMOLOGACAO" as "HOMOLOGACAO" | "PRODUCAO",
      naturezaOperacao: "",
      cfopInState: "",
      cfopOutState: "",
      icmsCsosn: "",
      icmsCst: "",
      origem: "",
    },
  });

  const form = useForm({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      document: "",
      phone: "",
      email: "",
      address: "",
      pixKey: "",
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
        pixKey: data.pixKey ?? "",
      });
      setLogo(data.logo ?? null);
    }
  }, [data, form]);

  useEffect(() => {
    if (fiscal) {
      fiscalForm.reset({
        stateRegistration: fiscal.stateRegistration ?? "",
        taxRegime: fiscal.taxRegime ?? "",
        addressStreet: fiscal.addressStreet ?? "",
        addressNumber: fiscal.addressNumber ?? "",
        addressComplement: fiscal.addressComplement ?? "",
        addressNeighborhood: fiscal.addressNeighborhood ?? "",
        addressCity: fiscal.addressCity ?? "",
        addressState: fiscal.addressState ?? "",
        addressZip: fiscal.addressZip ?? "",
        cityCode: fiscal.cityCode ?? "",
        invoiceAutoEmit: fiscal.invoiceAutoEmit,
        environment: fiscal.environment,
        naturezaOperacao: fiscal.naturezaOperacao ?? "",
        cfopInState: fiscal.cfopInState ?? "",
        cfopOutState: fiscal.cfopOutState ?? "",
        icmsCsosn: fiscal.icmsCsosn ?? "",
        icmsCst: fiscal.icmsCst ?? "",
        origem: fiscal.origem ?? "",
      });
    }
  }, [fiscal, fiscalForm]);

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
            <Field
              label="Chave Pix"
              htmlFor="c-pix"
              optional
              hint="Com a chave preenchida, a nota da venda sai com um QR code de pagamento."
            >
              <Input
                id="c-pix"
                placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"
                {...form.register("pixKey")}
              />
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

      {loadingFiscal ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <form
          onSubmit={fiscalForm.handleSubmit(async (values) => {
            try {
              await updateFiscal.mutateAsync(values);
              toast.success("Dados fiscais salvos.");
            } catch (error) {
              toast.error(
                error instanceof ApiError ? error.message : "Erro ao salvar.",
              );
            }
          })}
        >
          <Card>
            <CardHeader>
              <CardTitle>Dados fiscais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Necessários pra emitir nota fiscal (NFC-e/NF-e) nas vendas.
                Preencha quando for habilitar a emissão.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Inscrição Estadual" htmlFor="f-ie" optional hint='Deixe "ISENTO" se não tiver.'>
                  <Input id="f-ie" {...fiscalForm.register("stateRegistration")} />
                </Field>
                <Field label="Regime tributário" htmlFor="f-regime" optional>
                  <Input
                    id="f-regime"
                    placeholder="Ex.: Simples Nacional"
                    {...fiscalForm.register("taxRegime")}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Logradouro" htmlFor="f-street" optional>
                  <Input id="f-street" {...fiscalForm.register("addressStreet")} />
                </Field>
                <Field label="Número" htmlFor="f-number" optional>
                  <Input id="f-number" {...fiscalForm.register("addressNumber")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Complemento" htmlFor="f-complement" optional>
                  <Input id="f-complement" {...fiscalForm.register("addressComplement")} />
                </Field>
                <Field label="Bairro" htmlFor="f-neighborhood" optional>
                  <Input id="f-neighborhood" {...fiscalForm.register("addressNeighborhood")} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-[2fr_0.7fr_1fr_1fr]">
                <Field label="Cidade" htmlFor="f-city" optional>
                  <Input id="f-city" {...fiscalForm.register("addressCity")} />
                </Field>
                <Field label="UF" htmlFor="f-state" optional>
                  <Input id="f-state" maxLength={2} {...fiscalForm.register("addressState")} />
                </Field>
                <Field label="CEP" htmlFor="f-zip" optional>
                  <Input id="f-zip" {...fiscalForm.register("addressZip")} />
                </Field>
                <Field
                  label="Cód. IBGE"
                  htmlFor="f-citycode"
                  optional
                  hint="Do município — exigido no XML."
                >
                  <Input id="f-citycode" {...fiscalForm.register("cityCode")} />
                </Field>
              </div>

              <div className="space-y-4 border-t border-border/70 pt-4">
                <div>
                  <p className="text-sm font-medium">Padrões fiscais</p>
                  <p className="text-xs text-muted-foreground">
                    Aplicados a todas as notas — o provedor calcula o imposto a
                    partir daqui e do NCM de cada produto. Na dúvida, confirme com
                    seu contador.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Ambiente"
                    htmlFor="f-env"
                    hint="Homologação é teste (sem valor fiscal). Só use Produção quando estiver pronto."
                  >
                    <select
                      id="f-env"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      {...fiscalForm.register("environment")}
                    >
                      <option value="HOMOLOGACAO">Homologação (teste)</option>
                      <option value="PRODUCAO">Produção</option>
                    </select>
                  </Field>
                  <Field label="Natureza da operação" htmlFor="f-nat" optional>
                    <Input
                      id="f-nat"
                      placeholder="Ex.: Venda de mercadoria"
                      {...fiscalForm.register("naturezaOperacao")}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="CFOP dentro do estado" htmlFor="f-cfop-in" optional hint="Ex.: 5102">
                    <Input id="f-cfop-in" {...fiscalForm.register("cfopInState")} />
                  </Field>
                  <Field label="CFOP fora do estado" htmlFor="f-cfop-out" optional hint="Ex.: 6102">
                    <Input id="f-cfop-out" {...fiscalForm.register("cfopOutState")} />
                  </Field>
                  <Field label="CSOSN (Simples)" htmlFor="f-csosn" optional hint="Ex.: 102">
                    <Input id="f-csosn" {...fiscalForm.register("icmsCsosn")} />
                  </Field>
                  <Field label="Origem" htmlFor="f-origem" optional hint="0 = nacional">
                    <Input id="f-origem" maxLength={1} placeholder="0" {...fiscalForm.register("origem")} />
                  </Field>
                </div>
              </div>

              <label className="flex items-center justify-between gap-4 rounded-lg border border-border/70 p-4">
                <div>
                  <p className="text-sm font-medium">Emitir nota automaticamente</p>
                  <p className="text-xs text-muted-foreground">
                    Ligado: a nota é emitida sozinha ao fechar a venda. Desligado:
                    você emite manualmente no detalhe de cada venda.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-primary"
                  {...fiscalForm.register("invoiceAutoEmit")}
                />
              </label>

              <Button type="submit" loading={fiscalForm.formState.isSubmitting}>
                Salvar dados fiscais
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
