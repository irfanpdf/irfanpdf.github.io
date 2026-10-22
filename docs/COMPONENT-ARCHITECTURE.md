# Component architecture

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · static
export (`output: "export"`). No UI framework, no icon library, no analytics, no
runtime server.

## Routing map (all statically exported)

| Route | File | Kind | Purpose |
|---|---|---|---|
| `/` | `app/page.tsx` | server | Home: hero, highlights, benefits, workflow, use cases, screenshots, release, download, requirements, roadmap, FAQ preview |
| `/features/` | `app/features/page.tsx` | server | Verified feature inventory (12 groups from data) |
| `/how-it-works/` | `app/how-it-works/page.tsx` | server | 7 step-by-step real workflows + test evidence per flow |
| `/use-cases/` | `app/use-cases/page.tsx` | server | 6 audiences, each line mapped to a shipped capability |
| `/compare/` | `app/compare/page.tsx` | server shell | Comparison page; table is a client island |
| `/security/` | `app/security/page.tsx` | server | Code-derived security/privacy pillars + “not verified” list |
| `/download/` | `app/download/page.tsx` | server shell | Download Center; cards are a client island (checksum copy, link states) |
| `/docs/…` (10) | `app/docs/**` | server | Sidebar documentation section (layout + home + 9 content pages) |
| *(404)* | `app/not-found.tsx` | server | Custom not-found |
| `sitemap.xml` | `app/sitemap.ts` | static | Empty until `NEXT_PUBLIC_SITE_URL` is set |
| `robots.txt` | `app/robots.ts` | static | Allows all; sitemap line only with a configured URL |

`app/layout.tsx` is the shell: metadata (conditional canonical/OG), pre-paint theme
script, JSON-LD `SoftwareApplication`, skip link, header, `<main>`, footer.

## Components (`src/components/`)

| Component | Type | Depends on | Notes |
|---|---|---|---|
| `site-header.tsx` | client | `logo`, `theme-toggle`, `data/site` | Sticky nav, `aria-current`, mobile disclosure (`aria-expanded/controls`), Download CTA |
| `site-footer.tsx` | server | `logo`, `data/site` | 4-column footer incl. verification line (gate numbers + date) |
| `logo.tsx` | server | `next/link` | Inline SVG product mark (icon geometry, original code) |
| `theme-toggle.tsx` | client | — | Light/dark, persists `ipdf-site-theme`, `aria-label` reflects next state |
| `icons.tsx` | server | — | 55 original stroke icons + `Icon` / `IconChip` (no CDN) |
| `ui.tsx` | server | `icons` | Primitives: `PageHero`, `Section`, `Badge`, `CtaRow`, `CheckList`, `Stat`, `ToolCard`, `Note` |
| `compare-table.tsx` | **client** | `data/comparison`, `icons` | Category filter chips + “only differences” toggle (`aria-pressed`, `aria-live` count), status pills, source markers → citation anchors, legend |
| `download-cards.tsx` | **client** | `data/downloads`, `ui`, `icons` | Per-artifact cards: metadata table, SHA-256 with copy button (`aria-live`), link state: real URL / not-configured / not-verified |

## Data layer (`src/data/`) — single source of truth for content

| File | Feeds | Grounding |
|---|---|---|
| `site.ts` | nav, footer, all pages' version/OS/gate numbers | `server/config.py`, CHANGELOG, gate run 2026-10-17 |
| `features.ts` | Home highlights, Features page | `docs/VERIFICATION-REPORT.md` §1 |
| `downloads.ts` | Download page, Home release card | artifact measurements 2026-10-16 (hashes, bytes) |
| `comparison.ts` | Compare page + client table | vendor pages fetched 2026-10-16 (`SOURCES` with URLs + dates) |
| `roadmap.ts` | Home roadmap card | separated CURRENT (evidence)/PLANNED lists |
| `screenshots.ts` | Home + any image usage | actual files in `public/screenshots/` + real dimensions |
| `env.ts` | sitemap/robots/layout/`downloads` | `NEXT_PUBLIC_SITE_URL` — null-safe |

**Rule:** pages contain layout and wording; *facts* live in `data/*` so a
re-verification touches one file, not fifteen.

## Styling

* `app/globals.css` — Tailwind v4 (`@import "tailwindcss"`, `@custom-variant dark`,
  `@theme` tokens: brand `#cc0000`, brand-bright `#ff0000`, panel `#161926`) +
  component classes: `.btn*`, `.card`, `.eyebrow`, `.container-page`, `.skip-link`,
  `.prose-page` (typography for docs), focus-visible outline, reduced-motion block.
* Dark mode: class strategy, OS default, stored in `localStorage`, applied before
  first paint by an inline script (no flash).
* Colour: brand red on white = 5.88:1 (measured value quoted by the app's own
  changelog); dark links `#ff6b6b` = 6.3:1.

## Build/test hooks

* `npm run build` → `out/` (static), `npm run typecheck` → `tsc --noEmit`.
* Website test checklist lives in `docs/TESTING-REPORT.md`.
* No environment dependencies beyond the two optional public URL variables.
