# IRFAN PDF — Official Website

Static marketing/documentation website for the **Irfan PDF 1.7.0** Windows desktop
application. Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**,
exported fully statically (`output: "export"`) so it can be hosted anywhere — or
opened from a folder.

The application itself lives at `C:\Users\irfan.s\Desktop\docuforge` and is
**not modified** by this project. Every product claim on the site is grounded in
the project's own code, changelog and test suite — see
[`docs/VERIFICATION-REPORT.md`](docs/VERIFICATION-REPORT.md).

---

## Quick start

```powershell
cd C:\Users\irfan.s\Desktop\irfan-pdf-website
npm install          # once
npm run dev          # development server → http://localhost:3000
npm run build        # static export → out\
npm run typecheck    # tsc --noEmit
```

Node 20+ (tested with Node 24.20.0, npm 11.19.0).

## Build instructions (production)

```powershell
$env:NEXT_PUBLIC_SITE_URL = "https://your-domain.example"        # optional, see below
$env:NEXT_PUBLIC_DOWNLOAD_BASE_URL = "https://downloads.example.com/irfan-pdf"  # optional
npm run build
```

The site builds **without** either variable. Behaviour:

| Variable | Unset (default) | Set |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical / Open Graph / Twitter URL **omitted**, `robots.txt` without sitemap line, `sitemap.xml` empty | per-page canonical (17 pages), full OG + JSON-LD URL, populated `sitemap.xml` + sitemap line in `robots.txt` |
| `NEXT_PUBLIC_DOWNLOAD_BASE_URL` | Download buttons render a verified-metadata card with a **"Download link not configured yet"** state (checksums still shown) | real download links to `<base>/<filename>` |

**This repository intentionally contains no guessed URLs.** Set both variables to
your real addresses at deploy time. `.env.example` documents them.

Ready-made free-deployment path (GitHub Pages + GitHub Releases, step by step): see
[`docs/PUBLISH-GITHUB.md`](docs/PUBLISH-GITHUB.md).

Pages stay indexable in both states (`robots: index, follow`) — only URLs that
cannot be verified are omitted. Each page declares its own canonical through
`canonicalFor(path)` in `src/data/env.ts`, so no page can inherit another page's
canonical URL.

## Deployment

The build produces a static site in `out\`:

```powershell
npm run build
# publish out\ to any static host (IIS, nginx, GitHub Pages, S3, Netlify, …)
# or preview locally:
npx serve out
```

Notes:

1. `out\sitemap.xml` is empty until `NEXT_PUBLIC_SITE_URL` is set — rebuild with it
   before going live.
2. If you enable downloads, either host the three release files under the base URL
   (see `docs/VERIFICATION-REPORT.md` §4 for names + SHA-256) or point the base URL
   at your file host. The ZIP/EXE are large (7.3 MiB / 110.6 MiB / 148.6 MiB).
3. The site sets **no cookies** and includes **no analytics** — only a
   `localStorage` key (`ipdf-site-theme`) for the light/dark switch.
4. **Windows builds only:** `npm run build` ends with `node scripts/flatten-rsc.mjs`.
   This repairs a known upstream defect (vercel/next.js#85374) where a Windows
   static export writes RSC payloads into nested folders
   (`out\download\__next.download\__PAGE__.txt`) that the browser never requests,
   so every `<Link>` prefetch 404s. The script copies each payload to the flat
   name the client asks for. It is harmless on Linux/macOS builds and can be
   dropped once vercel/next.js#99058 ships.

## Testing this site

```powershell
npm run typecheck       # tsc --noEmit
npm run build           # static export + payload adapter
node test-server.js     # serves out\ on http://127.0.0.1:8123
node crawl.js           # routes, internal links, assets, 404, content checks
```

`crawl.js` exits non-zero on any failure, so it also works as a post-deploy smoke
test against a live URL (`node crawl.js https://your-domain`). Results of the last
full run — 20/20 routes, 0 broken internal links, 313/313 assets, Lighthouse
accessibility 1.00 on all 17 pages in light *and* dark, plus install / upgrade /
uninstall verification of the application — are in
[`docs/TESTING-REPORT.md`](docs/TESTING-REPORT.md).

## Project layout

```
irfan-pdf-website/
├─ src/
│  ├─ app/                  # App Router pages (all routes statically exported)
│  │  ├─ layout.tsx         # metadata, theme bootstrap, JSON-LD, header/footer
│  │  ├─ page.tsx           # Home
│  │  ├─ features/ how-it-works/ use-cases/ compare/ security/ download/
│  │  ├─ docs/              # documentation section (sidebar layout) + 9 sub-pages
│  │  ├─ not-found.tsx      # custom 404
│  │  ├─ sitemap.ts robots.ts
│  │  └─ globals.css        # Tailwind v4 + design tokens + prose styles
│  ├─ components/           # header, footer, logo, icons, ui primitives,
│  │                        # compare-table (client), download-cards (client)
│  └─ data/                 # verified content: site, features, downloads,
│                            # comparison (with citations), roadmap, screenshots, env
├─ public/
│  ├─ favicon.ico           # the real application icon (IrfanPDF.ico)
│  └─ screenshots/          # real captures from the running app (2026-10-16)
├─ scripts/flatten-rsc.mjs  # post-build fix for next.js#85374 (Windows export)
├─ test-server.js           # zero-dependency static server used by testing
├─ crawl.js                 # route/link/asset crawler (exits non-zero on failure)
├─ docs/                    # verification, testing, risk, roadmap, assets reports
└─ out/                     # build output (static)
```

See [`docs/COMPONENT-ARCHITECTURE.md`](docs/COMPONENT-ARCHITECTURE.md) for the
component inventory.

## Content rules (do not relax)

* **Never** add a feature, date, price, checksum or URL that is not backed by the
  project files listed in `docs/VERIFICATION-REPORT.md`.
* Competitor claims must keep their source markers (`[A1]`, `[F1]`, …) and the
  verification date.
* Roadmap: planned items live in `src/data/roadmap.ts` under `PLANNED` and are
  always labelled “Planned / Future”.
* “Not Verified” is a valid and required answer where evidence is missing.

## Reports (deliverables)

| Report | File |
|---|---|
| Verification report (STEP 1 inspection) | `docs/VERIFICATION-REPORT.md` |
| Testing report (site + application verification) | `docs/TESTING-REPORT.md` |
| Missing items | `docs/MISSING-ITEMS.md` |
| Risk report | `docs/RISK-REPORT.md` |
| Roadmap (current vs planned) | `docs/ROADMAP.md` |
| Asset inventory | `docs/ASSET-INVENTORY.md` |
| Component architecture | `docs/COMPONENT-ARCHITECTURE.md` |
| Build & deployment instructions | this file |
