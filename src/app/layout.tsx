import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  metadataBase: new URL("https://planixtradermax.vercel.app"),
  title: {
    default:
      "Planix TraderMax - Software para Controle de Day Trade, DARF, IRRF e Performance",
    template: "%s | Planix TraderMax",
  },
  description:
    "Software completo para day trade com cálculo automático de IRRF/DARF, compensação de imposto, curva de capital, gestão de operações e métricas de performance. Licença vitalícia.",
  keywords: [
    "day trade",
    "software day trade",
    "controle day trade",
    "darf day trade",
    "irrf day trade",
    "diário de trader",
    "gestão de operações",
    "planix tradermax",
    "calculadora darf",
    "software trader",
  ],
  authors: [{ name: "Planix TraderMax" }],
  creator: "Planix TraderMax",
  publisher: "Planix TraderMax",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "VDE9xlogiIAX5qVdZoDS4ViiBkG__JGdn3vE092IvTc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Planix TraderMax",
    title:
      "Planix TraderMax - Software para Controle de Day Trade, DARF e IRRF",
    description:
      "Controle suas operações, calcule DARF automaticamente e acompanhe sua performance com o Planix TraderMax.",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Planix TraderMax - Software para Day Trade",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Planix TraderMax - Software para Controle de Day Trade, DARF e IRRF",
    description:
      "Controle suas operações, calcule DARF automaticamente e acompanhe sua performance.",
    images: ["/img/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <JsonLd />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}