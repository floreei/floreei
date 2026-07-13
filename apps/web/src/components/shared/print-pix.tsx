"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { buildPixPayload } from "@/lib/pix";
import { formatCurrency } from "@/lib/utils";

/**
 * Bloco "Pague com Pix" dos documentos impressos: QR estático (BR Code) com a
 * chave da empresa e o valor em aberto — o cliente escaneia e paga na hora.
 * Com `copyable`, mostra um botão "Copiar chave Pix" (útil na cobrança online,
 * onde o cliente paga do próprio celular sem escanear).
 */
export function PrintPix({
  pixKey,
  merchantName,
  amount,
  txid,
  copyable = false,
}: {
  pixKey: string;
  merchantName: string;
  /** Valor da cobrança; omitido → o pagador digita. */
  amount?: number;
  txid?: string;
  /** Exibe o botão de copiar a chave (some na impressão). */
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const payload = buildPixPayload({
    key: pixKey,
    merchantName,
    amount,
    txid,
  });

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (contexto inseguro): a chave segue visível abaixo.
    }
  };

  return (
    <section className="mt-8 flex items-center gap-5 rounded-xl border border-primary/15 bg-secondary/30 p-5">
      <div className="shrink-0 rounded-lg bg-white p-2">
        <QRCode value={payload} size={112} aria-label="QR code de pagamento Pix" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/70">
          Pague com Pix
        </p>
        <p className="text-sm">
          Aponte a câmera do celular para o código
          {amount !== undefined && amount > 0 ? (
            <>
              {" "}
              e pague{" "}
              <span className="font-semibold tabular-nums">
                {formatCurrency(amount)}
              </span>
            </>
          ) : null}
          .
        </p>
        <p className="break-all text-xs text-muted-foreground">
          Chave Pix: {pixKey}
        </p>
        {copyable ? (
          <button
            type="button"
            onClick={copyKey}
            className="no-print mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Chave copiada!" : "Copiar chave Pix"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
