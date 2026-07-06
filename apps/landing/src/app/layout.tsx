import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Floreei — ERP e CRM para floriculturas e decoração de eventos",
  description:
    "Sistema de gestão (ERP e CRM) para floriculturas, floristas e decoradores de eventos: orçamentos, vendas, estoque, buquês com custeio e financeiro num só lugar.",
  applicationName: "Floreei",
  authors: [{ name: "Floreei" }],
  category: "business software",
  keywords: [
    "Floreei",
    "sistema para floricultura",
    "ERP para floricultura",
    "CRM para florista",
    "software para floricultura",
    "programa para floricultura",
    "sistema de gestão para floricultura",
    "sistema para decoração de eventos",
    "gestão de floricultura",
    "orçamento para floricultura",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Floreei",
    title: "Floreei — ERP e CRM para floriculturas e decoração de eventos",
    description:
      "Orçamentos, vendas, estoque, buquês com custeio e financeiro num só lugar. O sistema em português feito para floriculturas, floristas e decoradores.",
    images: [
      { url: "/icon-512.png", width: 512, height: 512, alt: "Floreei" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Floreei — ERP e CRM para floriculturas e eventos",
    description:
      "Sistema de gestão em português para floriculturas, floristas e decoradores: orçamentos, vendas, estoque e financeiro num só lugar.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2F6050",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
        {/* Sem JS, o reveal não dispara — garante o conteúdo visível. */}
        <noscript>
          <style>{`.sf-rv{opacity:1 !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
