"use client";

import QRCode from "react-qr-code";
import { buildPixPayload } from "@/lib/pix";
import { formatCurrency } from "@/lib/utils";

/**
 * Bloco "Pague com Pix" dos documentos impressos: QR estático (BR Code) com a
 * chave da empresa e o valor em aberto — o cliente escaneia e paga na hora.
 */
export function PrintPix({
  pixKey,
  merchantName,
  amount,
  txid,
}: {
  pixKey: string;
  merchantName: string;
  /** Valor da cobrança; omitido → o pagador digita. */
  amount?: number;
  txid?: string;
}) {
  const payload = buildPixPayload({
    key: pixKey,
    merchantName,
    amount,
    txid,
  });

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
      </div>
    </section>
  );
}
