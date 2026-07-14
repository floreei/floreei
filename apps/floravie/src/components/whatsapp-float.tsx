import { WhatsAppIcon } from "./icons";

/** Monta o link wa.me a partir do telefone (só dígitos; assume DDI BR se faltar). */
export function waLink(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return "https://wa.me/5581900000000";
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}`;
}

export function WhatsAppFloat({ whatsapp }: { whatsapp: string | null }) {
  return (
    <a
      className="wa-float"
      href={waLink(whatsapp)}
      target="_blank"
      rel="noopener"
      aria-label="Pedir pelo WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
}
