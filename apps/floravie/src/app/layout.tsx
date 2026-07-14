import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

// Display: Cormorant Garamond (400/500/600 + itálico). Corpo/UI: Jost (300–600).
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title:
    "Floravie Ateliê — Flores Online: Buquês, Arranjos e Cestas com Entrega no Mesmo Dia",
  description:
    "Floravie Ateliê: buquês, arranjos, vasos e cestas de presente feitos à mão. Entrega no mesmo dia em Recife e região metropolitana.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${cormorant.variable} ${jost.variable}`}>{children}</body>
    </html>
  );
}
