import type { CobrancaDocument, ProductUnit } from "@sistema-flores/types";
import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { unitLabels } from "./labels";
import { buildPixPayload } from "./pix";
import { formatCurrency, formatDate } from "./utils";

/**
 * Nota de cobrança em PDF, gerada no navegador a partir dos mesmos dados da
 * página pública `/c/[id]` — é o arquivo que o lojista anexa no WhatsApp.
 * Módulo pesado (motor de PDF): importe com `import()` só na hora de gerar.
 *
 * Cores = tokens do tema claro (globals.css) em hex, porque o PDF não lê CSS.
 */
const C = {
  primary: "#2f604f",
  secondary: "#eaf1ee",
  foreground: "#202c23",
  muted: "#5e6e64",
  border: "#e2e9e6",
  clay: "#ca6f4e",
  success: "#347954",
  white: "#ffffff",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.foreground,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },
  topBar: { height: 6, backgroundColor: C.primary, marginHorizontal: -40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.border,
  },
  letterhead: { flexDirection: "row", alignItems: "center", gap: 10, maxWidth: 320 },
  logo: { width: 44, height: 44, borderRadius: 8, objectFit: "contain" },
  logoFallback: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.primary,
  },
  companyName: { fontFamily: "Times-Bold", fontSize: 16, marginBottom: 3 },
  small: { fontSize: 8.5, color: C.muted },
  right: { alignItems: "flex-end" },
  title: { fontFamily: "Times-Bold", fontSize: 15, color: C.primary },
  pill: {
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  highlight: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.secondary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bigValue: { marginTop: 3, fontFamily: "Times-Bold", fontSize: 24, color: C.primary },
  table: { marginTop: 18 },
  thead: {
    flexDirection: "row",
    backgroundColor: C.secondary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: C.primary,
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  colItem: { flex: 1 },
  colNum: { width: 80, textAlign: "right" },
  totals: {
    marginTop: 18,
    alignSelf: "flex-end",
    width: 220,
    backgroundColor: C.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalsMain: {
    paddingBottom: 6,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pix: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 14,
  },
  qr: { width: 92, height: 92 },
  notes: { marginTop: 22, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 22,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    textAlign: "center",
    fontSize: 8,
    color: C.muted,
  },
});

type Status = "PAID" | "OVERDUE" | "OPEN";

function statusOf(doc: CobrancaDocument, todayISO: string): Status {
  if (doc.amountDue <= 0.005) return "PAID";
  if (doc.dueDate && doc.dueDate.slice(0, 10) < todayISO) return "OVERDUE";
  return "OPEN";
}

const STATUS: Record<Status, { label: string; color: string; bg: string }> = {
  PAID: { label: "Pago", color: C.success, bg: "#e6f1eb" },
  OVERDUE: { label: "Em atraso", color: C.clay, bg: "#f9ebe6" },
  OPEN: { label: "Em aberto", color: C.primary, bg: "#e6efeb" },
};

/** Só PNG/JPEG entram no PDF; outros formatos de logo caem no quadrado da marca. */
function embeddableLogo(logo: string | null): string | null {
  return logo && /^data:image\/(png|jpe?g);base64,/i.test(logo) ? logo : null;
}

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CobrancaPdf({
  doc,
  qrDataUrl,
}: {
  doc: CobrancaDocument;
  /** QR do Pix já renderizado (PNG em data URL), ou null sem Pix. */
  qrDataUrl: string | null;
}) {
  const status = statusOf(doc, todayLocal());
  const st = STATUS[status];
  const logo = embeddableLogo(doc.company.logo);
  const contact = [doc.company.phone, doc.company.email].filter(Boolean).join(" · ");
  const paid = doc.receivedValue > 0.005;

  return (
    <Document
      title={`Cobrança ${doc.reference} — ${doc.customerName}`}
      author={doc.company.name}
    >
      <Page size="A4" style={s.page}>
        <View style={s.topBar} fixed />

        <View style={s.header}>
          <View style={s.letterhead}>
            {logo ? <PdfImage src={logo} style={s.logo} /> : <View style={s.logoFallback} />}
            <View>
              <Text style={s.companyName}>{doc.company.name}</Text>
              {doc.company.document ? (
                <Text style={s.small}>CNPJ/CPF: {doc.company.document}</Text>
              ) : null}
              {doc.company.address ? <Text style={s.small}>{doc.company.address}</Text> : null}
              {contact ? <Text style={s.small}>{contact}</Text> : null}
            </View>
          </View>
          <View style={s.right}>
            <Text style={s.title}>Cobrança</Text>
            <Text style={s.small}>Referência nº {doc.reference}</Text>
            <Text style={[s.pill, { color: st.color, backgroundColor: st.bg }]}>{st.label}</Text>
          </View>
        </View>

        <View style={s.highlight}>
          <View>
            <Text style={s.label}>{status === "PAID" ? "Valor pago" : "Valor a pagar"}</Text>
            <Text style={s.bigValue}>
              {formatCurrency(status === "PAID" ? doc.soldValue : doc.amountDue)}
            </Text>
          </View>
          <View style={s.right}>
            <Text style={s.label}>{doc.dueDate ? "Vencimento" : "Data da compra"}</Text>
            <Text style={{ marginTop: 3, fontFamily: "Helvetica-Bold" }}>
              {formatDate(doc.dueDate ?? doc.date)}
            </Text>
            <Text style={s.small}>Cliente: {doc.customerName}</Text>
          </View>
        </View>

        {doc.items.length > 0 ? (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={s.colItem}>Item</Text>
              <Text style={s.colNum}>Qtd.</Text>
              <Text style={s.colNum}>Valor unit.</Text>
              <Text style={s.colNum}>Total</Text>
            </View>
            {doc.items.map((item, i) => (
              <View key={i} style={s.tr} wrap={false}>
                <Text style={s.colItem}>{item.description}</Text>
                <Text style={s.colNum}>
                  {item.quantity} {(unitLabels[item.unit as ProductUnit] ?? "").toLowerCase()}
                </Text>
                <Text style={s.colNum}>{formatCurrency(item.unitSalePrice)}</Text>
                <Text style={s.colNum}>{formatCurrency(item.lineTotal)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={{
              marginTop: 18,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 6,
              padding: 10,
            }}
          >
            {doc.title}
          </Text>
        )}

        <View style={s.totals}>
          <View style={[s.totalsRow, s.totalsMain]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
            <Text style={{ fontFamily: "Times-Bold", fontSize: 15, color: C.primary }}>
              {formatCurrency(doc.soldValue)}
            </Text>
          </View>
          {paid ? (
            <View style={s.totalsRow}>
              <Text style={{ color: C.muted }}>Pago</Text>
              <Text style={{ color: C.success }}>{formatCurrency(doc.receivedValue)}</Text>
            </View>
          ) : null}
          {doc.amountDue > 0.005 ? (
            <View style={s.totalsRow}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>A receber</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", color: C.clay }}>
                {formatCurrency(doc.amountDue)}
              </Text>
            </View>
          ) : null}
        </View>

        {qrDataUrl && doc.pixKey ? (
          <View style={s.pix} wrap={false}>
            <PdfImage src={qrDataUrl} style={s.qr} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.label}>Pague com Pix</Text>
              <Text>
                Aponte a câmera do celular para o código e pague{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{formatCurrency(doc.amountDue)}</Text>.
              </Text>
              <Text style={s.small}>Chave Pix: {doc.pixKey}</Text>
            </View>
          </View>
        ) : null}

        {doc.mpLink && doc.amountDue > 0.005 ? (
          <Text style={{ marginTop: 14 }}>
            Pagar pelo Mercado Pago: <Text style={{ color: C.primary }}>{doc.mpLink}</Text>
          </Text>
        ) : null}

        <Text style={{ marginTop: 14 }}>
          Ver esta cobrança online: <Text style={{ color: C.primary }}>{doc.link}</Text>
        </Text>

        {doc.notes ? (
          <View style={s.notes}>
            <Text style={s.label}>Observações</Text>
            <Text style={{ marginTop: 3 }}>{doc.notes}</Text>
          </View>
        ) : null}

        <Text style={s.footer} fixed>
          Cobrança criada com Floreei · o sistema para floriculturas
        </Text>
      </Page>
    </Document>
  );
}

/** QR estático do Pix (BR Code) como PNG em data URL, ou null quando não há Pix a pagar. */
async function pixQrDataUrl(doc: CobrancaDocument): Promise<string | null> {
  if (!doc.pixKey || doc.amountDue <= 0.005) return null;
  const payload = buildPixPayload({
    key: doc.pixKey,
    merchantName: doc.company.name,
    amount: doc.amountDue,
    txid: doc.reference,
  });
  return QRCode.toDataURL(payload, { margin: 0, width: 320, errorCorrectionLevel: "M" });
}

/** Gera o PDF da nota de cobrança no navegador. */
export async function renderCobrancaPdf(doc: CobrancaDocument): Promise<Blob> {
  const qrDataUrl = await pixQrDataUrl(doc);
  return pdf(<CobrancaPdf doc={doc} qrDataUrl={qrDataUrl} />).toBlob();
}
