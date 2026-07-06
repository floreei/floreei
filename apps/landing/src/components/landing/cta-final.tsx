import { WHATSAPP_LINK } from "@/lib/site";
import { Cta } from "./cta";
import { WhatsappIcon } from "./icons";

export function CtaFinal() {
  return (
    <section className="py-16">
      <div className="sf-wrap">
        <div
          className="relative overflow-hidden rounded-xl px-6 py-16 text-center shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)), hsl(160 40% 19%))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          <span
            aria-hidden="true"
            className="sf-blob pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full"
            style={{ background: "hsl(0 0% 100% / .06)" }}
          />
          <span
            aria-hidden="true"
            className="sf-blob2 pointer-events-none absolute -bottom-16 -left-10 h-64 w-64 rounded-full"
            style={{ background: "hsl(160 30% 14% / .45)" }}
          />

          <h2 className="sf-serif t-cta relative font-semibold leading-tight">
            Vamos organizar a sua floricultura juntos?
          </h2>
          <p
            className="relative mx-auto mt-4 max-w-xl text-[17px] leading-relaxed"
            style={{ color: "hsl(var(--primary-foreground) / .85)" }}
          >
            Fale com a gente no WhatsApp. Em poucos minutos mostramos o sistema
            funcionando com o seu tipo de negócio.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Cta
              href={WHATSAPP_LINK}
              variant="clay"
              className="!h-14 !px-8 text-[17px]"
            >
              <WhatsappIcon className="h-5 w-5" />
              Falar no WhatsApp agora
            </Cta>
          </div>
          <p
            className="relative mt-4 text-sm"
            style={{ color: "hsl(var(--primary-foreground) / .7)" }}
          >
            Resposta no mesmo dia · Sem compromisso
          </p>
        </div>
      </div>
    </section>
  );
}
