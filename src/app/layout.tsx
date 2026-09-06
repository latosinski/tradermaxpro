import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "TraderMaxPro - Software para Controle de Day Trade, DARF, IRRF e Performance do Trader",
  description:
    "Software completo com cálculos automáticos de IRRF/DARF, com compensação de imposto, curva de capital e métricas de performance. Licença vitalícia, instalação rápida.",
  keywords:
    "day trade, software day trade, controle day trade, darf day trade, irrf day trade, diário de trader, gestão de operações, tradermaxpro",
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
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}