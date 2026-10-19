import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/restrito", "/api/"],
      },
    ],
    sitemap: "https://planixtradermax.vercel.app/sitemap.xml",
  };
}