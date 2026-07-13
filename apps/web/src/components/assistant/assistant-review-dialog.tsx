"use client";

import type {
  AssistantDraft,
  AssistantExecuteResult,
  BatchSale,
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
          <SaleDraftEditor
            sale={d}
            onChange={(s) => setD({ ...s, kind: "CREATE_SALE" } as AssistantDraft)}
          />
        ) : d.kind === "CREATE_SALES_BATCH" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {d.sales.length} vendas — revise e ajuste cada uma antes de confirmar.
            </p>
            {d.sales.map((sale, i) => (
              <SaleDraftEditor
                key={i}
                sale={sale}
                index={i + 1}
                onChange={(s) => {
                  const sales = [...d.sales];
                  sales[i] = s;
                  setD({ ...d, sales });
                }}
              />
            ))}
          </div>
        ) : d.kind === "EDIT_PURCHASE" ? (
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
        ) : (
          <SimpleDraftEditor draft={d} onChange={setD} />
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

/** Editor de uma venda (usado na venda única e em cada venda do lote). */
function SaleDraftEditor({
  sale,
  onChange,
  index,
}: {
  sale: BatchSale;
  onChange: (s: BatchSale) => void;
  index?: number;
}) {
  const wrap = (patch: Partial<BatchSale>) => onChange({ ...sale, ...patch });
  const setItem = (
    i: number,
    patch: Partial<NonNullable<BatchSale["items"]>[number]>,
  ) => {
    const items = [...(sale.items ?? [])];
    items[i] = { ...items[i], ...patch };
    wrap({ items });
  };

  const body = (
    <div className="space-y-4">
      {sale.newCustomer ? (
        <Section
          icon={<UserPlus className="h-4 w-4" />}
          title="Novo cliente"
          hint="ainda não existe na base — vamos cadastrar"
        >
          <Field label="Nome" htmlFor={`rv-cust-${index ?? 0}`}>
            <Input
              id={`rv-cust-${index ?? 0}`}
              value={sale.newCustomer.name}
              onChange={(e) =>
                wrap({
                  newCustomer: { ...sale.newCustomer!, name: e.target.value },
                  customerName: e.target.value,
                })
              }
            />
          </Field>
        </Section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Cliente:{" "}
          <span className="font-medium text-foreground">{sale.customerName}</span> ·{" "}
          {sale.channel === "WHOLESALE" ? "Atacado" : "Venda direta"}
        </p>
      )}

      <Section icon={<ShoppingCart className="h-4 w-4" />} title="Venda">
        {sale.items && sale.items.length > 0 ? (
          <div className="space-y-2">
            {sale.items.map((item, i) => (
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
                    onChange={(e) => setItem(i, { quantity: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Preço unit.
                  <CurrencyInput
                    className="mt-1 h-9 w-28"
                    value={item.unitSalePrice}
                    onChange={(v) => setItem(i, { unitSalePrice: v })}
                  />
                </label>
              </div>
            ))}
          </div>
        ) : (
          <Field label="Valor da venda" htmlFor={`rv-amount-${index ?? 0}`}>
            <CurrencyInput
              id={`rv-amount-${index ?? 0}`}
              value={sale.amount ?? 0}
              onChange={(v) => wrap({ amount: v })}
            />
            {sale.title ? (
              <p className="mt-1 text-xs text-muted-foreground">{sale.title}</p>
            ) : null}
          </Field>
        )}

        <div className="mt-3 flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={sale.paid}
              onChange={(e) => wrap({ paid: e.target.checked })}
            />
            <span className="font-medium">Já pago</span>
            <span className="text-muted-foreground">(recebido agora)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={sale.delivered}
              onChange={(e) => wrap({ delivered: e.target.checked })}
            />
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Já entregue</span>
          </label>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Data" htmlFor={`rv-sdate-${index ?? 0}`}>
            <Input
              id={`rv-sdate-${index ?? 0}`}
              type="date"
              value={sale.date ?? ""}
              onChange={(e) => wrap({ date: e.target.value })}
            />
          </Field>
          {!sale.paid ? (
            <Field label="Vencimento" htmlFor={`rv-sdue-${index ?? 0}`}>
              <Input
                id={`rv-sdue-${index ?? 0}`}
                type="date"
                value={sale.dueDate ?? ""}
                onChange={(e) => wrap({ dueDate: e.target.value })}
              />
            </Field>
          ) : null}
        </div>
      </Section>
    </div>
  );

  if (!index) return body;
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Venda {index}
      </p>
      {body}
    </div>
  );
}

const NATIVE_SELECT =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const PAYMENT_METHODS: Array<[string, string]> = [
  ["PIX", "Pix"],
  ["CASH", "Dinheiro"],
  ["CARD", "Cartão"],
  ["TRANSFER", "Transferência"],
  ["BOLETO", "Boleto"],
  ["OTHER", "Outro"],
];

/** Rascunhos simples (cadastros, estoque, financeiro) com campos editáveis. */
function SimpleDraftEditor({
  draft,
  onChange,
}: {
  draft: AssistantDraft;
  onChange: (d: AssistantDraft) => void;
}) {
  if (draft.kind === "CREATE_CUSTOMER") {
    const d = draft;
    return (
      <Section icon={<UserPlus className="h-4 w-4" />} title="Novo cliente">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" htmlFor="sd-name">
            <Input
              id="sd-name"
              value={d.name}
              onChange={(e) => onChange({ ...d, name: e.target.value })}
            />
          </Field>
          <Field label="WhatsApp" htmlFor="sd-wa">
            <Input
              id="sd-wa"
              value={d.whatsapp ?? ""}
              onChange={(e) => onChange({ ...d, whatsapp: e.target.value })}
            />
          </Field>
        </div>
      </Section>
    );
  }

  if (draft.kind === "CREATE_PRODUCT") {
    const d = draft;
    return (
      <Section icon={<Sparkles className="h-4 w-4" />} title="Novo produto">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" htmlFor="sd-pname">
            <Input
              id="sd-pname"
              value={d.name}
              onChange={(e) => onChange({ ...d, name: e.target.value })}
            />
          </Field>
          <Field label="Unidade" htmlFor="sd-unit">
            <select
              id="sd-unit"
              className={NATIVE_SELECT}
              value={d.unit}
              onChange={(e) =>
                onChange({ ...d, unit: e.target.value as ProductUnit })
              }
            >
              {Object.entries(unitLabels).map(([u, label]) => (
                <option key={u} value={u}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preço de venda" htmlFor="sd-price">
            <CurrencyInput
              id="sd-price"
              value={d.defaultSalePrice}
              onChange={(v) => onChange({ ...d, defaultSalePrice: v })}
            />
          </Field>
          <Field label="Preço de compra" htmlFor="sd-pprice">
            <CurrencyInput
              id="sd-pprice"
              value={d.defaultPurchasePrice}
              onChange={(v) => onChange({ ...d, defaultPurchasePrice: v })}
            />
          </Field>
        </div>
      </Section>
    );
  }

  if (draft.kind === "CREATE_ARRANGEMENT") {
    const d = draft;
    return (
      <Section icon={<Sparkles className="h-4 w-4" />} title="Novo buquê">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" htmlFor="sd-aname">
            <Input
              id="sd-aname"
              value={d.name}
              onChange={(e) => onChange({ ...d, name: e.target.value })}
            />
          </Field>
          <Field label="Preço" htmlFor="sd-aprice">
            <CurrencyInput
              id="sd-aprice"
              value={d.salePrice}
              onChange={(v) => onChange({ ...d, salePrice: v })}
            />
          </Field>
        </div>
      </Section>
    );
  }

  if (draft.kind === "ADJUST_STOCK") {
    const d = draft;
    return (
      <Section icon={<PackageCheck className="h-4 w-4" />} title="Ajuste de estoque">
        <p className="mb-3 text-sm">
          Produto: <span className="font-medium">{d.productName}</span>
        </p>
        <Field label="Novo saldo em estoque" htmlFor="sd-bal">
          <Input
            id="sd-bal"
            type="number"
            min={0}
            value={d.newBalance}
            onChange={(e) => onChange({ ...d, newBalance: Number(e.target.value) })}
          />
        </Field>
      </Section>
    );
  }

  if (draft.kind === "CREATE_EXPENSE") {
    const d = draft;
    return (
      <Section icon={<PackageCheck className="h-4 w-4" />} title="Nova despesa">
        <div className="space-y-3">
          <Field label="Descrição" htmlFor="sd-desc">
            <Input
              id="sd-desc"
              value={d.description}
              onChange={(e) => onChange({ ...d, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Centro de custo" htmlFor="sd-cc">
              <Input
                id="sd-cc"
                value={d.costCenter}
                onChange={(e) => onChange({ ...d, costCenter: e.target.value })}
              />
            </Field>
            <Field label="Valor" htmlFor="sd-amount">
              <CurrencyInput
                id="sd-amount"
                value={d.amount}
                onChange={(v) => onChange({ ...d, amount: v })}
              />
            </Field>
            <Field label="Vencimento" htmlFor="sd-due">
              <Input
                id="sd-due"
                type="date"
                value={d.dueDate}
                onChange={(e) => onChange({ ...d, dueDate: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Section>
    );
  }

  if (draft.kind !== "REGISTER_PAYMENT") return null;
  const d = draft;
  return (
    <Section
      icon={<PackageCheck className="h-4 w-4" />}
      title={d.target === "EVENT" ? "Receber de cliente" : "Pagar fornecedor"}
    >
      <p className="mb-3 text-sm">
        {d.target === "EVENT" ? "Venda" : "Compra"}:{" "}
        <span className="font-medium">{d.label}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Valor" htmlFor="sd-pamount">
          <CurrencyInput
            id="sd-pamount"
            value={d.amount}
            onChange={(v) => onChange({ ...d, amount: v })}
          />
        </Field>
        <Field label="Forma" htmlFor="sd-method">
          <select
            id="sd-method"
            className={NATIVE_SELECT}
            value={d.method ?? "PIX"}
            onChange={(e) => onChange({ ...d, method: e.target.value })}
          >
            {PAYMENT_METHODS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Data" htmlFor="sd-pdate">
          <Input
            id="sd-pdate"
            type="date"
            value={d.date}
            onChange={(e) => onChange({ ...d, date: e.target.value })}
          />
        </Field>
      </div>
    </Section>
  );
}
