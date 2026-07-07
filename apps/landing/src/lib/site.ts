/**
 * Configuração da landing. Troque o WhatsApp e o e-mail pelos valores reais
 * (ou via as variáveis NEXT_PUBLIC_* no build) — é o CTA principal da página.
 */
export const WHATSAPP_LINK =
  process.env.NEXT_PUBLIC_WHATSAPP_LINK ??
  "https://wa.me/5500000000000?text=Ol%C3%A1!%20Quero%20conhecer%20o%20Floreei";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@floreei.com.br";

/** URL canônica do site (sem barra final) — usada em SEO, OG e sitemap. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://floreei.com.br"
).replace(/\/$/, "");

/** App do cliente (cadastro/teste grátis) — CTA principal da seção de planos. */
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.floreei.com.br"
).replace(/\/$/, "");

/**
 * API pública (com o prefixo /api) — a seção de planos busca os preços
 * vigentes aqui; se estiver fora do ar, a landing usa os valores-padrão.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"
).replace(/\/$/, "");

/** Link do WhatsApp com uma mensagem sob medida (reusa o número configurado). */
export function whatsappWith(text: string): string {
  const base = WHATSAPP_LINK.split("?")[0];
  return `${base}?text=${encodeURIComponent(text)}`;
}

/** Itens de navegação do header (âncoras para as seções). */
export const NAV_ITEMS = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#detalhes", label: "Módulos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "Dúvidas" },
];
