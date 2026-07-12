"use client";

import { QuoteBuilder } from "@/components/quotes/quote-builder";
import { PageHeader } from "@/components/shared/page-header";

export default function NewQuotePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo orçamento"
        description="Adicione produtos e buquês e veja custo, venda, lucro e margem em tempo real."
      />
      <QuoteBuilder />
    </div>
  );
}
