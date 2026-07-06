import type { CompanySettings } from "@sistema-flores/types";
import { Flower2 } from "lucide-react";

/** Cabeçalho da empresa para documentos impressos (orçamento, nota do pedido). */
export function PrintLetterhead({
  settings,
  company,
}: {
  settings?: CompanySettings;
  company: string;
}) {
  const contactLine = [settings?.phone, settings?.email]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3">
      {settings?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logo}
          alt={company}
          className="h-14 w-14 rounded-xl object-contain"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Flower2 className="h-6 w-6" />
        </span>
      )}
      <div className="space-y-0.5">
        <p className="font-serif text-xl font-semibold tracking-tight">
          {company}
        </p>
        {settings?.document ? (
          <p className="text-xs text-muted-foreground">
            CNPJ/CPF: {settings.document}
          </p>
        ) : null}
        {settings?.address ? (
          <p className="text-xs text-muted-foreground">{settings.address}</p>
        ) : null}
        {contactLine ? (
          <p className="text-xs text-muted-foreground">{contactLine}</p>
        ) : null}
      </div>
    </div>
  );
}
