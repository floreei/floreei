"use client";

import type {
  AssistantDraft,
  AssistantExecuteResult,
  ProductUnit,
} from "@sistema-flores/types";
import { PackageCheck, ShoppingCart, Sparkles, Store, Truck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useAssistantExecute } from "@/lib/api/assistant";
import { unitLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Resumo da ação proposta pela IA para o usuário aprovar. Campos-chave são
 * editáveis (nomes de itens novos, quantidade, preço, entregue, data) — nada é
 * gravado até "Confirmar e registrar".
 */
export function AssistantReviewDialog({
  draft,
  open,
  onOpenChange,
  onDone,
}: {
  draft: AssistantDraft;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (result: AssistantExecuteResult) => void;
}) {
  const [d, setD] = useState<AssistantDraft>(draft);
  const execute = useAssistantExecute();

  useEffect(() => {
    if (open) setD(draft);
  }, [open, draft]);

  const confirm = async () => {
    try {
      const result = await execute.mutateAsync(d);
      toast.success(result.message);
      onOpenChange(false);
      onDone(result);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível registrar.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {d.kind === "EDIT_PURCHASE" ? "Confirmar alteração" : "Confirmar registro"}
          </DialogTitle>
          <DialogDescription>
            Revise e ajuste o que precisar. Nada é salvo até você confirmar.
          </DialogDescription>
        </DialogHeader>

        {d.kind === "CREATE_PURCHASE" ? (
          <div className="space-y-4">
            {/* Novo fornecedor */}
            {d.newSupplier ? (
              <Section
                icon={<Store className="h-4 w-4" />}
                title="Novo fornecedor"
                hint="ainda não existe na base — vamos cadastrar"
              >
                <Field label="Nome" htmlFor="rv-sup">
                  <Input
                    id="rv-sup"
                    value={d.newSupplier.name}
                    onChange={(e) =>
                      setD({
                        ...d,
                        newSupplier: { ...d.newSupplier!, name: e.target.value },
                        supplierName: e.target.value,
                      })
                    }
                  />
                </Field>
              </Section>
            ) : (
              <p className="text-sm text-muted-foreground">
                Fornecedor: <span className="font-medium text-foreground">{d.supplierName}</span>
              </p>
            )}

            {/* Novos produtos */}
            {d.newProducts.length > 0 ? (
              <Section
                icon={<Sparkles className="h-4 w-4" />}
                title={d.newProducts.length === 1 ? "Novo produto" : "Novos produtos"}
                hint="ainda não existe na base — vamos cadastrar"
              >
                <div className="space-y-2">
                  {d.newProducts.map((p, i) => (
                    <Input
                      key={i}
                      value={p.name}
                      onChange={(e) => {
                        const newProducts = [...d.newProducts];
                        newProducts[i] = { ...newProducts[i], name: e.target.value };
                        setD({ ...d, newProducts });
                      }}
                    />
                  ))}
                </div>
              </Section>
            ) : null}

            {/* Itens da compra */}
            <Section icon={<PackageCheck className="h-4 w-4" />} title="Compra">
              <div className="space-y-2">
                {d.items.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto_auto] items-end gap-2 rounded-lg border border-border/60 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {unitLabels[item.unit as ProductUnit] ?? item.unit}
                      </p>
                    </div>
                    <label className="text-xs text-muted-foreground">
                      Qtd.
                      <Input
                        type="number"
                        min={1}
                        className="mt-1 h-9 w-20"
                        value={item.quantity}
                        onChange={(e) => {
                          const items = [...d.items];
                          items[i] = { ...items[i], quantity: Number(e.target.value) };
                          setD({ ...d, items });
                        }}
                      />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Preço unit.
                      <CurrencyInput
                        className="mt-1 h-9 w-28"
                        value={item.unitPrice}
                        onChange={(v) => {
                          const items = [...d.items];
                          items[i] = { ...items[i], unitPrice: v };
                          setD({ ...d, items });
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Data da compra" htmlFor="rv-date">
                  <Input
                    id="rv-date"
                    type="date"
                    value={d.date}
                    onChange={(e) => setD({ ...d, date: e.target.value })}
                  />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={d.delivered}
                    onChange={(e) => setD({ ...d, delivered: e.target.checked })}
                  />
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Já entregue</span>
                  <span className="text-muted-foreground">(entra no estoque)</span>
                </label>
              </div>
            </Section>
          </div>
        ) : d.kind === "CREATE_SALE" ? (
          <div className="space-y-4">
            {d.newCustomer ? (
              <Section
                icon={<UserPlus className="h-4 w-4" />}
                title="Novo cliente"
                hint="ainda não existe na base — vamos cadastrar"
              >
                <Field label="Nome" htmlFor="rv-cust">
                  <Input
                    id="rv-cust"
                    value={d.newCustomer.name}
                    onChange={(e) =>
                      setD({
                        ...d,
                        newCustomer: { ...d.newCustomer!, name: e.target.value },
                        customerName: e.target.value,
                      })
                    }
                  />
                </Field>
              </Section>
            ) : (
              <p className="text-sm text-muted-foreground">
                Cliente:{" "}
                <span className="font-medium text-foreground">{d.customerName}</span>{" "}
                · {d.channel === "WHOLESALE" ? "Atacado" : "Venda direta"}
              </p>
            )}

            <Section icon={<ShoppingCart className="h-4 w-4" />} title="Venda">
              {d.items && d.items.length > 0 ? (
                <div className="space-y-2">
                  {d.items.map((item, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_auto_auto] items-end gap-2 rounded-lg border border-border/60 p-2.5"
                    >
                      <p className="min-w-0 truncate text-sm font-medium">
                        {item.description}
                      </p>
                      <label className="text-xs text-muted-foreground">
                        Qtd.
                        <Input
                          type="number"
                          min={1}
                          className="mt-1 h-9 w-20"
                          value={item.quantity}
                          onChange={(e) => {
                            const items = [...(d.items ?? [])];
                            items[i] = { ...items[i], quantity: Number(e.target.value) };
                            setD({ ...d, items });
                          }}
                        />
                      </label>
                      <label className="text-xs text-muted-foreground">
                        Preço unit.
                        <CurrencyInput
                          className="mt-1 h-9 w-28"
                          value={item.unitSalePrice}
                          onChange={(v) => {
                            const items = [...(d.items ?? [])];
                            items[i] = { ...items[i], unitSalePrice: v };
                            setD({ ...d, items });
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <Field label="Valor da venda" htmlFor="rv-amount">
                  <CurrencyInput
                    id="rv-amount"
                    value={d.amount ?? 0}
                    onChange={(v) => setD({ ...d, amount: v })}
                  />
                  {d.title ? (
                    <p className="mt-1 text-xs text-muted-foreground">{d.title}</p>
                  ) : null}
                </Field>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Data da venda" htmlFor="rv-sdate">
                  <Input
                    id="rv-sdate"
                    type="date"
                    value={d.date}
                    onChange={(e) => setD({ ...d, date: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={d.paid}
                    onChange={(e) => setD({ ...d, paid: e.target.checked })}
                  />
                  <span className="font-medium">Já pago</span>
                  <span className="text-muted-foreground">(recebido agora)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={d.delivered}
                    onChange={(e) => setD({ ...d, delivered: e.target.checked })}
                  />
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Já entregue</span>
                </label>
              </div>

              {!d.paid ? (
                <Field
                  label="Vencimento (opcional)"
                  htmlFor="rv-sdue"
                  className="mt-3"
                >
                  <Input
                    id="rv-sdue"
                    type="date"
                    value={d.dueDate ?? ""}
                    onChange={(e) => setD({ ...d, dueDate: e.target.value })}
                  />
                </Field>
              ) : null}
            </Section>
          </div>
        ) : (
          <Section icon={<PackageCheck className="h-4 w-4" />} title={d.purchaseLabel}>
            <ul className="space-y-1.5 text-sm">
              {d.changes.delivered === true ? (
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Marcar como entregue
                  (entra no estoque)
                </li>
              ) : null}
              {d.changes.delivered === false ? (
                <li>Desfazer entrega</li>
              ) : null}
              {d.changes.date ? <li>Nova data: {d.changes.date}</li> : null}
              {d.changes.deliveryDate ? (
                <li>Nova entrega: {d.changes.deliveryDate}</li>
              ) : null}
              {d.changes.notes ? <li>Observação: {d.changes.notes}</li> : null}
            </ul>
          </Section>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continuar ajustando
          </Button>
          <Button onClick={confirm} loading={execute.isPending}>
            Confirmar e registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-muted/20 p-4")}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <span className="font-semibold">{title}</span>
        {hint ? (
          <span className="text-xs text-muted-foreground">— {hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
