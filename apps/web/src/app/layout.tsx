import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { MobileKeyboard } from "@/components/layout/mobile-keyboard";
import { RouteProgress } from "@/components/layout/route-progress";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Fraunces: serifa old-style suave e com peso — títulos com presença, sem
// o "fio de cabelo" fino da Playfair. opsz ativa o desenho display nos títulos.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Floreei — Gestão para floriculturas, floristas, atacado e eventos",
  description:
    "ERP para floriculturas, floristas, atacado e decoração de eventos: insumos, estoque, buquês com custeio, compras, vendas, despesas e financeiro — tudo num só lugar.",
  manifest: "/manifest.webmanifest",
  // Instalado na tela inicial (PWA): título curto e tela cheia no iOS.
  appleWebApp: {
    capable: true,
    title: "Floreei",
    statusBarStyle: "default",
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
  // Ocupa a área do notch/home-indicator; a bottom nav respeita a safe area.
  viewportFit: "cover",
  // Android: teclado virtual REDIMENSIONA o layout (o form não fica coberto).
  // iOS ignora (não suportado) — lá o MobileKeyboard cuida via scroll nativo.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
        <MobileKeyboard />
        <RouteProgress />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
