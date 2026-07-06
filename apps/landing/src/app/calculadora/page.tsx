import type { Metadata } from "next";
import { Flower2 } from "lucide-react";
import Link from "next/link";
import { Cta } from "@/components/landing/cta";
import { FounderOffer } from "@/components/landing/founder-offer";
import { WhatsappIcon } from "@/components/landing/icons";
import { PriceCalculator } from "@/components/landing/price-calculator";
import { CONTACT_EMAIL, SITE_URL, WHATSAPP_LINK } from "@/lib/site";

export const metadata: Metadata = {
  title: "Calculadora de preço de buquê — quanto cobrar? | Floreei",
  description:
    "Descubra o custo real de um buquê e a margem de lucro na hora. Ferramenta grátis do Floreei para floriculturas e floristas pararem de vender no chute.",
  alternates: { canonical: "/calculadora" },
  keywords: [
    "calculadora de preço de buquê",
    "quanto cobrar por um buquê",
    "margem de lucro floricultura",
    "como precificar buquê",
    "formação de preço floricultura",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${SITE_URL}/calculadora`,
    siteName: "Floreei",
    title: "Calculadora de preço de buquê — quanto cobrar?",
    description:
      "Veja o custo real e a margem de lucro de um buquê na hora. Ferramenta grátis do Floreei.",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Floreei" }],
  },
};

export default function CalculadoraPage() {
  return (
    <>
      {/* Header enxuto — página de isca, foco em uma ação só */}
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{
          background: "hsl(var(--background) / .82)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="sf-wrap flex h-[68px] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Flower2 className="h-[18px] w-[18px]" />
            </span>
            <span className="sf-serif text-[19px] font-semibold">Floreei</span>
          </Link>
          <Cta href={WHATSAPP_LINK} className="!h-11 !px-4">
            <WhatsappIcon className="h-[18px] w-[18px]" />
            <span className="max-[560px]:hidden">Falar no WhatsApp</span>
            <span className="hidden max-[560px]:inline">WhatsApp</span>
          </Cta>
        </div>
      </header>

      <main>
        {/* Hero — hook de aversão à perda */}
        <section className="relative overflow-hidden">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-10 h-64 w-64 rounded-full"
            style={{ background: "hsl(var(--clay) / .08)" }}
          />
          <div className="sf-wrap section-y relative mx-auto max-w-3xl text-center">
            <p className="eyebrow">Ferramenta grátis</p>
            <h1 className="sf-serif t-hero mt-4 font-semibold leading-[1.05]">
              Você está lucrando de verdade em cada buquê?
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[19px] leading-relaxed text-muted-foreground">
              Muita floricultura precifica no chute e deixa dinheiro na mesa.
              Ajuste a margem abaixo e veja o custo real e o preço certo — na
              hora.
            </p>
          </div>
        </section>

        <PriceCalculator />

        <FounderOffer />
      </main>

      {/* Footer enxuto */}
      <footer className="border-t border-border py-10">
        <div className="sf-wrap flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="sf-serif text-base font-semibold text-foreground"
          >
            Floreei
          </Link>
          <p>Sistema para floriculturas, floristas e decoradores de eventos.</p>
          <div className="mt-1 flex flex-wrap justify-center gap-x-5 gap-y-1">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="sf-link"
            >
              WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="sf-link">
              {CONTACT_EMAIL}
            </a>
            <Link href="/" className="sf-link">
              Conhecer o Floreei
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
