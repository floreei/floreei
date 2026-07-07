/**
 * Payload Pix "copia e cola" (BR Code, padrão EMV do Banco Central) para QR
 * estático: quem escanear paga direto na chave da empresa, já com o valor.
 * Sem dependências — TLV + CRC16-CCITT implementados aqui.
 */

/** Campo TLV: id (2 dígitos) + tamanho (2 dígitos) + valor. */
function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF), exigido pelo BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Nome/cidade no BR Code: sem acentos, maiúsculas, tamanho limitado. */
function emvText(value: string, max: number): string {
  const ascii = value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^A-Za-z0-9 .-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return (ascii || "FLOREEI").slice(0, max);
}

export interface PixPayloadInput {
  /** Chave Pix: CPF/CNPJ, e-mail, telefone (+55…) ou chave aleatória. */
  key: string;
  /** Nome de quem recebe (máx. 25 caracteres no payload). */
  merchantName: string;
  /** Cidade de quem recebe (máx. 15); sem cidade, "BRASIL". */
  city?: string;
  /** Valor em reais; omitido → o pagador digita o valor. */
  amount?: number;
  /** Identificador da cobrança (A–Z, a–z, 0–9, máx. 25); padrão "***". */
  txid?: string;
}

/** Monta o payload completo do QR Pix estático (pronto para virar QR code). */
export function buildPixPayload(input: PixPayloadInput): string {
  const txid = (input.txid ?? "***").replace(/[^A-Za-z0-9*]/g, "").slice(0, 25) || "***";
  const merchantAccount =
    tlv("00", "br.gov.bcb.pix") + tlv("01", input.key.trim().slice(0, 77));

  let payload =
    tlv("00", "01") + // formato do payload
    tlv("26", merchantAccount) +
    tlv("52", "0000") + // categoria do lojista (não informada)
    tlv("53", "986"); // BRL
  if (input.amount !== undefined && input.amount > 0) {
    payload += tlv("54", input.amount.toFixed(2));
  }
  payload +=
    tlv("58", "BR") +
    tlv("59", emvText(input.merchantName, 25)) +
    tlv("60", emvText(input.city ?? "BRASIL", 15)) +
    tlv("62", tlv("05", txid));

  payload += "6304"; // id+tamanho do CRC, incluídos no cálculo
  return payload + crc16(payload);
}

/** Confere o CRC de um payload BR Code (útil em testes/validações). */
export function isValidPixPayload(payload: string): boolean {
  if (!/6304[0-9A-F]{4}$/.test(payload)) return false;
  return payload.endsWith(crc16(payload.slice(0, -4)));
}
