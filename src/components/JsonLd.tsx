export default function JsonLd() {
  const siteUrl = "https://planixtradermax.vercel.app";

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Planix TraderMax",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Windows",
    description:
      "Software para controle de operações de day trade com cálculo automático de IRRF e DARF, compensação de imposto, curva de capital e métricas de performance.",
    url: siteUrl,
    image: `${siteUrl}/img/og-image.jpg`,
    offers: {
      "@type": "Offer",
      price: "129.90",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: siteUrl,
    },
    featureList: [
      "Cálculo automático de IRRF e DARF",
      "Compensação de imposto",
      "Curva de capital",
      "Gestão de operações",
      "Exportação de dados em CSV e PDF",
    ],
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Planix TraderMax",
    url: siteUrl,
    logo: `${siteUrl}/img/logo-planix.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: "+55-51-98212-7790",
      availableLanguage: ["Portuguese"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Planix TraderMax",
    url: siteUrl,
    inLanguage: "pt-BR",
  };

  const data = [softwareApp, organization, website];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}