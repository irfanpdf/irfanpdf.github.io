import type { MetadataRoute } from "next";
import { SITE_URL } from "@/data/env";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // No domain configured → return an empty sitemap rather than inventing URLs.
  // The deployment guide documents setting NEXT_PUBLIC_SITE_URL before launch.
  if (!SITE_URL) return [];

  const routes = [
    "",
    "/features/",
    "/how-it-works/",
    "/use-cases/",
    "/compare/",
    "/security/",
    "/download/",
    "/docs/",
    "/docs/installation/",
    "/docs/ocr-guide/",
    "/docs/conversion-guide/",
    "/docs/troubleshooting/",
    "/docs/faq/",
    "/docs/release-notes/",
    "/docs/contact/",
    "/docs/privacy/",
    "/docs/terms/",
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r}`,
    lastModified: new Date("2026-10-16"),
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : r.startsWith("/docs") ? 0.6 : 0.8,
  }));
}
