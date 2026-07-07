"use client";

import type {
  Feature,
  PlanOffer,
  UpdatePlanDefinitionInput,
} from "@sistema-flores/types";
import { ALL_FEATURES, FEATURE_INFO } from "@sistema-flores/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useAdminAuth } from "@/lib/auth/auth-context";
import { formatCurrency } from "@/lib/utils";

/**
 * Edição dos planos vigentes: preço-base, preço por usuário e features de cada
 * um. Nada é fixo no código — o que se salva aqui vale na hora para novas
 * contas e entra na próxima cobrança dos assinantes atuais.
 */
export default function PlanosPage() {
  const { session } = useAdminAuth();
  const canEdit = session?.role === "OWNER";

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => api.get<PlanOffer[]>("/admin/plans"),
  });

  if (isLoading || !plans) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="font-serif text-3xl font-semibold">Planos</h1>
        <p className="text-sm text-muted-foreground">
          Preços e recursos de cada plano. Mudanças valem na hora para novas
          assinaturas; para quem já assina, o novo valor entra na próxima
          cobrança.
          {!canEdit ? " Somente OWNER pode editar." : ""}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} canEdit={canEdit} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, canEdit }: { plan: PlanOffer; canEdit: boolean }) {
  const qc = useQueryClient();
  const [name, setName] = useState(plan.name);
  const [tagline, setTagline] = useState(plan.tagline);
  const [basePrice, setBasePrice] = useState(String(plan.basePrice));
  const [userPrice, setUserPrice] = useState(String(plan.userPrice));
  const [features, setFeatures] = useState<Feature[]>(plan.features);

  // Ressincroniza o formulário quando o servidor devolve o plano atualizado.
  useEffect(() => {
    setName(plan.name);
    setTagline(plan.tagline);
    setBasePrice(String(plan.basePrice));
    setUserPrice(String(plan.userPrice));
    setFeatures(plan.features);
  }, [plan]);

  const save = useMutation({
    mutationFn: (body: UpdatePlanDefinitionInput) =>
      api.put<PlanOffer>(`/admin/plans/${plan.id}`, body),
    onSuccess: (updated) => {
      qc.setQueryData<PlanOffer[]>(["plans"], (old) =>
        old?.map((p) => (p.id === updated.id ? updated : p)),
      );
      toast.success(`Plano ${updated.name} salvo.`);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
  });

  const toggleFeature = (feature: Feature) =>
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature],
    );

  const dirty =
    name !== plan.name ||
    tagline !== plan.tagline ||
    Number(basePrice) !== plan.basePrice ||
    Number(userPrice) !== plan.userPrice ||
    features.slice().sort().join(",") !== plan.features.slice().sort().join(",");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {plan.name}
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular">
            {formatCurrency(plan.basePrice)}/mês (1 usuário) +{" "}
            {formatCurrency(plan.userPrice)}/usuário adicional
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FieldRow label="Nome">
          <Input
            value={name}
            disabled={!canEdit}
            onChange={(e) => setName(e.target.value)}
          />
        </FieldRow>
        <FieldRow label="Descrição curta">
          <Input
            value={tagline}
            disabled={!canEdit}
            onChange={(e) => setTagline(e.target.value)}
          />
        </FieldRow>
        <div className="grid grid-cols-2 gap-3">
          <FieldRow label="Base — 1 usuário (R$/mês)">
            <Input
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              value={basePrice}
              disabled={!canEdit}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </FieldRow>
          <FieldRow label="Usuário adicional (R$/mês)">
            <Input
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              value={userPrice}
              disabled={!canEdit}
              onChange={(e) => setUserPrice(e.target.value)}
            />
          </FieldRow>
        </div>

        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Recursos incluídos
          </p>
          {ALL_FEATURES.map((feature) => (
            <label
              key={feature}
              className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                checked={features.includes(feature)}
                disabled={!canEdit}
                onChange={() => toggleFeature(feature)}
              />
              {FEATURE_INFO[feature].label}
            </label>
          ))}
        </div>

        {canEdit ? (
          <Button
            className="w-full"
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate({
                name,
                tagline,
                basePrice: Number(basePrice),
                userPrice: Number(userPrice),
                features,
              })
            }
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar plano
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
