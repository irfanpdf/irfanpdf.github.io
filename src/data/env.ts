import type { Metadata } from "next";

// Build-time environment. Canonical/OG/sitemap URLs are only emitted when a
// real domain is configured — this site never guesses URLs.

export const SITE_URL: string | null =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || null;

/**
 * Per-page canonical URL for the metadata `alternates.canonical` field.
 * Returns an empty object while NEXT_PUBLIC_SITE_URL is unset, so an
 * unconfigured build ships no canonical tag instead of a guessed one.
 * The root layout sets `metadataBase` so the relative path resolves.
 */
export function canonicalFor(path: string): Pick<Metadata, "alternates"> {
  return SITE_URL ? { alternates: { canonical: path } } : {};
}
