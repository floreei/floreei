/**
 * Configuração da landing. Troque o WhatsApp e o e-mail pelos valores reais
 * (ou via as variáveis NEXT_PUBLIC_* no build) — é o CTA principal da página.
 */
export const WHATSAPP_LINK =
  process.env.NEXT_PUBLIC_WHATSAPP_LINK ??
  "https://wa.me/5500000000000?text=Ol%C3%A1!%20Quero%20conhecer%20o%20Floreei";

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@floreei.com.br";

/** Itens de navegação do header (âncoras para as seções). */
export const NAV_ITEMS = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#detalhes", label: "Módulos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "Dúvidas" },
];
