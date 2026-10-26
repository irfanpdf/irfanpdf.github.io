# Publishing the site to GitHub Pages — `irfanpdf.github.io`

Why this shape (all checked 2026-10-22):

* **Username `irfanpdf` is free** (`api.github.com/users/irfanpdf` → 404, re-verified
  2026-10-22). A user named `irfanpdf` gets the site URL **`https://irfanpdf.github.io/`**
  — free for the lifetime of the account, HTTPS included.
* The account was created as `[previous username redacted]` (2026-10-13) and is being renamed to
  `irfanpdf` (GitHub → Settings → Account → Change username). The rename must happen
  **before** the repositories below are created; nothing has been pushed yet, so nothing
  breaks. After the rename, `irfanpdf.github.io` is claimable by this account alone.
* A **user site** serves at the domain root, which is exactly what this export needs
  (root-absolute links; no `basePath`). A project site (`you.github.io/repo/`) would need
  path-prefix changes and is deliberately not used.
* The three packages are 7.3 / 110.6 / 148.6 MiB. Cloudflare Pages and Netlify cap files at
  25–100 MB; **GitHub Releases allows 2 GB per file, free** — so the files live in a second
  repo's Releases and the site points at them.

## Preconditions

1. GitHub account **named `irfanpdf`** (the existing `[previous username redacted]` account renamed;
   only its owner can sign in and perform the steps below).
2. `git` on this machine (present: Git 2.56.0).

## Steps

### 1. Create two public repositories

| Repo | Purpose | Settings |
|---|---|---|
| `irfanpdf.github.io` | the website | public |
| `irfanpdf-releases` | hosts the 3 install packages as a release | public |

Create both empty (no README, no .gitignore) so the first push stays clean.

### 2. Push this project's source

```powershell
cd <checkout-path>\irfan-pdf-website
git init -b main
git add .
git commit -m "IRFAN PDF website"
git remote add origin https://github.com/irfanpdf/irfanpdf.github.io.git
git push -u origin main
```

(The repository is already initialized and committed locally — only the remote add and
the push remain. The first push asks for GitHub credentials; a sign-in window opens in
the browser.)

The workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) builds the
static export on GitHub (Node 20, same `npm run build`) and deploys `out/` to Pages. It
needs no Jekyll `.nojekyll` because deployment is via the Pages artifact action.

### 3. Enable Pages and set the two build variables

In `irfanpdf.github.io`:

* **Settings → Pages → Build and deployment → Source: GitHub Actions.**
* **Settings → Secrets and variables → Actions → Variables → New repository variable**, twice:

| Name | Value |
|---|---|
| `SITE_URL` | `https://irfanpdf.pages.dev` *(changed 2026-10-25 — the site's canonical host after the Cloudflare Pages move; was `https://irfanpdf.github.io`. Both hosts still serve, but both advertise `pages.dev` as canonical. See `CLOUDFLARE-PAGES-MIGRATION.md` §2.4.)* |
| `DOWNLOAD_BASE_URL` | `https://github.com/irfanpdf/irfanpdf-releases/releases/download/v1.7.0/` |

(The workflow passes them to the build as `NEXT_PUBLIC_SITE_URL` /
`NEXT_PUBLIC_DOWNLOAD_BASE_URL`; when they are absent the build stays in its honest
"not configured" state — nothing is ever guessed.)

### 4. Upload the packages

1. Create a tag/release **`v1.7.0`** in `irfanpdf-releases` (Releases → Draft a new release).
2. Attach the three artifacts from the application's `dist` folder (`<path-to>\docuforge\dist\`):

   | File | Size | SHA-256 (first 8) |
   |---|---|---|
   | `IrfanPDF_Setup_1.7.0.exe` | 110.6 MiB | `C57968BA…` |
   | `IRFAN-PDF-PROFESSIONAL.zip` | 148.6 MiB | `02B95E24…` |
   | `IrfanPDF_Portable.zip` | 7.3 MiB | `72EAA801…` |

3. Publish the release.

### 5. Verify the live site

* `https://irfanpdf.github.io/` loads, all 17 routes reachable (run
  `node crawl.js https://irfanpdf.github.io` — it checks routes, internal links, local
  assets, the 404 status and the content checks, and prints OVERALL PASS/FAIL).
* Every page's canonical points at `https://irfanpdf.pages.dev/...` (the canonical host
  since the Cloudflare Pages move — this holds on **both** hosts, including the
  `irfanpdf.github.io` copy).
* `https://irfanpdf.github.io/sitemap.xml` lists 17 URLs, all under `pages.dev`;
  `robots.txt` has the Sitemap line.
* The three Download Center buttons resolve (HTTP 200 after redirects) and the page shows
  the SHA-256 checksums.

## Updating the site later

Edit locally → `git push` → the workflow rebuilds and redeploys. Package updates: add a
new release tag in `irfanpdf-releases` and update `DOWNLOAD_BASE_URL` (and the data in
`src/data/downloads.ts`) accordingly.

## Checks that produced the facts above

* `https://api.github.com/users/irfanpdf` → 404 on 2026-10-22 (username free; checked
  twice that day, before and after the decision to rename).
* `https://github.com/irfanpdf/irfanpdf.github.io` → 404 on 2026-10-22 (the user-site
  repository — and therefore the root URL — unclaimed).
* The account's former profile URL (previous username redacted) → live profile on 2026-10-22 (the account that
  performs this plan; renamed to `irfanpdf` per the note above).
* `irfanpdf.pages.dev` → NXDOMAIN on 2026-10-22 (free, but Cloudflare's 25 MiB file cap
  cannot host the packages, and it still needs a Cloudflare account — not chosen).
* `irfanpdf.js.org`, `irfanpdf.is-a.dev` → already resolve (taken).
* `irfanpdf.netlify.app`, `irfanpdf.vercel.app` → HTTP 404 but their DNS is catch-all, so
  availability cannot be proven; not chosen.
* `gh` CLI is **not** installed on this machine; `git` 2.56.0 is.
