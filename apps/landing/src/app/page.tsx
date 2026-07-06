import { BeforeAfter } from "@/components/landing/before-after";
import { CtaFinal } from "@/components/landing/cta-final";
import { Demo } from "@/components/landing/demo";
import { Faq } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Inside } from "@/components/landing/inside";
// Planos ocultos por ora — usamos orçamento no WhatsApp (QuoteCta). Reativar quando
// a tabela de preços estiver definida:
// import { Plans } from "@/components/landing/plans";
import { PriceCalculator } from "@/components/landing/price-calculator";
import { QuoteCta } from "@/components/landing/quote-cta";
import { SocialProof } from "@/components/landing/social-proof";
import { Testimonials } from "@/components/landing/testimonials";
import { StructuredData } from "@/components/seo/structured-data";

export default function Home() {
  return (
    <>
      <StructuredData />
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <BeforeAfter />
        <Features />
        <Demo />
        <Inside />
        <PriceCalculator />
        <HowItWorks />
        <Testimonials />
        {/* <Plans /> — oculto; orçamento pelo WhatsApp */}
        <QuoteCta />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
