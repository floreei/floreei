import { Check } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/site";
import { Cta } from "./cta";
import { WhatsappIcon } from "./icons";
import { SectionHeading } from "./section-heading";

const POINTS = ["7 dias grátis", "Sem instalação", "Cancele quando quiser"];

/**
 * Seção de orçamento sob medida (no lugar da tabela de planos). O preço é
 * conversado no WhatsApp — mantém a âncora #planos para a navegação.
 */
export function QuoteCta() {
  return (
    <section
      id="planos"
      className="section-y"
      style={{ background: "hsl(var(--secondary) / .5)" }}
    >
      <div className="sf-wrap">
        <SectionHeading
          eyebrow="Planos sob medida"
          title="Um plano do tamanho da sua floricultura"
          subtitle="Cada negócio é diferente. Fale com a gente no WhatsApp e montamos um orçamento sem compromisso — no seu ritmo."
        />

        <div className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-5">
          <Cta
            href={WHATSAPP_LINK}
            variant="clay"
            className="!h-14 !px-8 text-[17px]"
          >
            <WhatsappIcon className="h-5 w-5" />
            Fazer um orçamento no WhatsApp
          </Cta>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {POINTS.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
