"use client";

import type { Event, Paginated } from "@sistema-flores/types";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api/client";
import { fetchCobrancaDocuments } from "@/lib/api/dunning";
import type { SalesInsightsFilters } from "@/lib/api/events";
import { cobrancaFileName, cobrancasZipName } from "@/lib/cobranca-files";
import { downloadBlob } from "@/lib/download";
import { cn } from "@/lib/utils";

/** Página máxima da API; o lote percorre todas as páginas do filtro atual. */
const PAGE_SIZE = 200;

/** Ids de todas as vendas em aberto (não canceladas, com saldo) que batem com o filtro. */
async function unpaidSaleIds(filters: SalesInsightsFilters): Promise<string[]> {
  // Set: uma venda que mude de página entre duas consultas não entra duas vezes.
  const ids = new Set<string>();
  for (let page = 1; ; page++) {
    const res = await api.get<Paginated<Event>>("/events", {
      page,
      pageSize: PAGE_SIZE,
      channel: filters.channel,
      type: filters.type,
      paymentStatus: filters.paymentStatus,
      delivered: filters.delivered,
      charged: filters.charged,
      search: filters.search || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    });
    for (const e of res.data) {
      if (e.status !== "CANCELED" && e.soldValue - e.receivedValue > 0.005) ids.add(e.id);
    }
    if (page >= res.totalPages) break;
  }
  return [...ids];
}

/**
 * Baixa as notas de cobrança (PDF) de todas as vendas EM ABERTO que aparecem
 * na listagem com o filtro atual — todas as páginas, não só a visível. Uma
 * venda sai como PDF direto; várias saem num ZIP. Não marca como cobrada.
 */
export function ExportCobrancasButton({
  filters,
  className,
}: {
  filters: SalesInsightsFilters;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const exportar = async () => {
    setBusy(true);
    const toastId = toast.loading("Buscando as vendas em aberto…");
    try {
      const ids = await unpaidSaleIds(filters);
      if (ids.length === 0) {
        toast.info("Nenhuma venda em aberto nesse filtro.", { id: toastId });
        return;
      }
      const documents = (
        await Promise.all(
          Array.from({ length: Math.ceil(ids.length / PAGE_SIZE) }, (_, i) =>
            fetchCobrancaDocuments(ids.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE)),
          ),
        )
      ).flatMap((r) => r.documents);
      if (documents.length === 0) {
        toast.info("Nenhuma venda em aberto nesse filtro.", { id: toastId });
        return;
      }

      const { renderCobrancaPdf } = await import("@/lib/cobranca-pdf");
      if (documents.length === 1) {
        toast.loading("Gerando a nota…", { id: toastId });
        downloadBlob(await renderCobrancaPdf(documents[0]), cobrancaFileName(documents[0]));
        toast.success("Nota baixada.", { id: toastId });
        return;
      }

      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const used = new Set<string>();
      for (const [i, doc] of documents.entries()) {
        toast.loading(`Gerando as notas… ${i + 1} de ${documents.length}`, { id: toastId });
        // Mesmo cliente e referência repetidos não se sobrescrevem no ZIP.
        let name = cobrancaFileName(doc);
        if (used.has(name)) name = name.replace(/\.pdf$/, ` (${i + 1}).pdf`);
        used.add(name);
        zip.file(name, await renderCobrancaPdf(doc));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, cobrancasZipName(filters.from ?? "", filters.to ?? ""));
      toast.success(`${documents.length} notas baixadas em um ZIP.`, { id: toastId });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível gerar as notas.",
        { id: toastId },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={busy}
      aria-busy={busy}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60",
        className,
      )}
    >
      <FileDown className="h-4 w-4 text-muted-foreground" aria-hidden />
      {busy ? "Gerando notas…" : "Baixar cobranças (PDF)"}
    </button>
  );
}
