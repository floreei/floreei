import { faqData } from "@/data/landing";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

/**
 * Dados estruturados (Schema.org / JSON-LD) para o Google entender o produto e
 * a marca — melhora a busca por "Floreei" e habilita o rich result de FAQ.
 */
export function StructuredData() {
  const description =
    "Sistema de gestão (ERP e CRM) para floriculturas, floristas e decoradores de eventos: orçamentos, vendas, estoque, buquês com custeio e financeiro num só lugar.";

  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Floreei",
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      email: CONTACT_EMAIL,
      description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Floreei",
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "Floreei",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "ERP, CRM",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      url: SITE_URL,
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
        description: "7 dias grátis para testar, sem fidelidade.",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: faqData.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const json = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      // JSON serializado — conteúdo controlado, sem input do usuário.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
