import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
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
  title: "Floreei — Gestão para floriculturas, floristas, atacado e eventos",
  description:
    "Do orçamento ao caixa, tudo em um só lugar. Orçamentos, vendas, estoque e financeiro num sistema simples, pensado para floriculturas, floristas, atacado e decoração de eventos.",
  openGraph: {
    title: "Floreei — A floricultura inteira, num só lugar",
    description:
      "Orçamentos, vendas, estoque e financeiro num sistema simples, em português. Fale com a gente no WhatsApp.",
    type: "website",
    locale: "pt_BR",
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
