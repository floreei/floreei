/**
 * Cliente mínimo do Mercado Pago (REST, sem SDK). Cada floricultura usa o
 * próprio access token — o dinheiro cai na conta dela.
 */
const MP_API = "https://api.mercadopago.com";

export interface MpPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
}

export async function createPreference(
  accessToken: string,
  opts: {
    items: MpPreferenceItem[];
    externalReference: string;
    notificationUrl: string;
    backUrls?: { success?: string; failure?: string; pending?: string };
    payerEmail?: string;
  },
): Promise<{ id: string; initPoint: string }> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: opts.items.map((i) => ({ ...i, currency_id: "BRL" })),
      external_reference: opts.externalReference,
      notification_url: opts.notificationUrl,
      back_urls: opts.backUrls,
      auto_return: "approved",
      payer: opts.payerEmail ? { email: opts.payerEmail } : undefined,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Mercado Pago: falha ao criar preferência (${res.status}) ${await res.text()}`,
    );
  }
  const data = (await res.json()) as { id: string; init_point: string };
  return { id: data.id, initPoint: data.init_point };
}

/** Consulta autoritativa do pagamento — usada no webhook para confirmar a venda. */
export async function getPayment(
  accessToken: string,
  paymentId: string,
): Promise<{ status: string; externalReference: string | null } | null> {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status: string;
    external_reference: string | null;
  };
  return { status: data.status, externalReference: data.external_reference };
}
