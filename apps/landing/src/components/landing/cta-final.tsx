import { Check } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/site";
import { Cta } from "./cta";
import { WhatsappIcon } from "./icons";
import { PhotoBadge } from "./photo-badge";
import { Reveal } from "./reveal";

export function CtaFinal() {
  return (
    <section className="py-16">
      <div className="sf-wrap">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-xl px-6 py-14 shadow-lg sm:px-10 lg:px-14"
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

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="sf-serif t-cta font-semibold leading-tight">
                  Vamos organizar a sua floricultura juntos?
                </h2>
                <p
                  className="mt-4 max-w-xl text-[17px] leading-relaxed"
                  style={{ color: "hsl(var(--primary-foreground) / .85)" }}
                >
                  Fale com a gente no WhatsApp. Em poucos minutos mostramos o
                  sistema funcionando com o seu tipo de negócio.
                </p>
                <div className="mt-8">
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
                  className="mt-4 text-sm"
                  style={{ color: "hsl(var(--primary-foreground) / .7)" }}
                >
                  Resposta no mesmo dia · Sem compromisso
                </p>
              </div>

              <div className="relative mx-auto hidden w-full max-w-sm sm:block">
                <div className="rounded-2xl bg-primary-foreground/10 p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/landing/cta-final.webp"
                    alt="Equipe conversando sobre o Floreei"
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                </div>
                <PhotoBadge
                  icon={<Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  title="Configuramos com você"
                  className="-bottom-5 left-1/2 -translate-x-1/2 sm:left-5 sm:translate-x-0"
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
