# Cloudflare Pages migration — runbook for the security headers

**Status: PREPARED, NOT PERFORMED (2026-10-25).** Everything below has been built and
verified locally; the only thing missing is a Cloudflare account, which only you can
create. Nothing in this repository has been pushed or deployed.

**Why:** the site is served by GitHub Pages, which cannot send custom response headers —
so the browser-verified policy in [`SECURITY-HARDENING.md`](SECURITY-HARDENING.md) is
deployed but inert (finding **S1** in [`WEBSITE-ANALYSIS.md`](WEBSITE-ANALYSIS.md)). The
chosen path is **Cloudflare Pages with no custom domain** (decision, 2026-10-25), because
you don't own a domain and `*.github.io` cannot be proxied through Cloudflare.

---

## 1. What was fixed in the repo so this works at all

Cloudflare documents two hard limits for a `_headers` file: **100 rules** and **2,000
characters per line** (counting indentation and the header name). The policy as first
written violated the second:

| | chars | result on Cloudflare |
|---|---|---|
| Single `/*` CSP with the union of all 40 hashes | **2,516** | line over the limit → rule dropped → **site ships with no CSP** |
| Hashes that fit in one line / hashes needed | **29** / **40** | can't be made to fit |

`scripts/gen-headers.mjs` was rewritten to emit **two tiers** — a catch-all rule with a
fallback CSP (345-char value) plus one strict per-page rule with that page's own 4–9
hashes (567–842 chars). A real page matches both and browsers **intersect** the two
policies, so the effective script rule stays hash-only. This was proven in a real browser
before the change (a single header value containing `policyA, policyB` ran the hashed
control script and blocked the unhashed one — identical to two header fields), and
`scripts/serve-headers.mjs` reproduces Cloudflare's comma-join locally so what is tested
is what would ship.

Current build output, from `npm run build`:

```
gen-headers: 58 rules (1 catch-all + 57 strict per-page) / limit 100; longest line 842 chars / limit 2000
gen-headers: catch-all CSP = 345 chars (fallback); strict CSP per page = 572–842 chars
```

The generator now **fails the build** if any line exceeds 2,000 chars or the rule count
exceeds 100, so a future growth in page count cannot silently produce a file a real host
would drop.

---

## 2. The steps (in order)

### 2.1 Create the account — *you*

Free Cloudflare account with an email you control. I cannot create this, and it is the
only step blocked on a credential.

### 2.2 Create the Pages project — *you, ~3 minutes*

Dashboard → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git** →
select `irfanpdf/irfanpdf.github.io` (or upload `out/` directly with `wrangler pages deploy out`).

| Setting | Value |
|---|---|
| Build command | `npm run build` (runs `next build && flatten-rsc && gen-headers`) |
| Build output directory | `out` |
| Root directory | `/` (repo root) |
| Node version | set env **`NODE_VERSION` = `24`** — the repo is tested with Node 24.20.0 |

### 2.3 Environment variables — *build-time, required*

Set for **Production** (and Preview) in the project's **Settings → Environment variables**:

| Name | Value | Why it matters |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<project>.pages.dev` | Without it the export deliberately omits canonical/OG URLs and emits a 110-byte empty sitemap (measured: local 125,835 B vs live 126,862 B HTML). The live site gets these from the GitHub Actions `SITE_URL` variable — Cloudflare has its own copy to maintain. |
| `NEXT_PUBLIC_DOWNLOAD_BASE_URL` | `https://github.com/irfanpdf/irfanpdf-releases/releases/download/v1.7.0` | Without it the download page shows "Download link not configured" instead of the three working links. |

`_headers` in `out/` is picked up automatically — **no** extra configuration, and (because
the site is a pure static export with no Pages Functions) there is no exception that would
bypass it.

### 2.4 The decision only you can make: what happens to `irfanpdf.github.io`

The repo name is the **organization's root Pages site**; it cannot be renamed without
losing that namespace. Options:

| Option | Effect |
|---|---|
| **Run both** (recommended) | GitHub Pages keeps serving the old URL header-less; Cloudflare serves `*.pages.dev` with headers. Set `NEXT_PUBLIC_SITE_URL` to the Pages URL so canonical/OG/sitemap all point there — search engines consolidate to the new URL while old links keep working. |
| **Disable GitHub Pages** after cutover | Old URL starts returning 404. Anywhere the old URL is written (README badges, third-party links, search index) breaks. |
| **Don't migrate** | S1 stays open forever; no headers. |

**Not decided here.** This is a content/SEO call, not a security one.

### 2.5 Verify after the first deploy — *me, or you with these commands*

```powershell
node scripts/check-live-headers.mjs https://<project>.pages.dev   # must end: OVERALL: PASS
node crawl.js https://<project>.pages.dev                         # must end: OVERALL: PASS
```

Then load `/`, `/download/`, `/docs/` in a browser and read the console: **0 "Content
Security Policy" messages**. The checker asserts, per route: every required header
present, `nosniff`/`DENY`/`Referrer-Policy` values correct, the **strict** tier (with
`sha256-` hashes) on real routes, the **catch-all** tier on an unmatched URL, a real 404
for unknown paths, and that `/_headers` itself is not downloadable.

It already passes against the local hardened server: **OVERALL: PASS** (6 routes + unmatched
URL + `/_headers`), crawl **347 assets / 0 failed**, browser **0 violations** on 7 routes.

### 2.6 Rollback — zero risk

Delete the Cloudflare Pages project. The GitHub Actions workflow was never touched, so
`irfanpdf.github.io` has been serving continuously throughout and needs nothing to resume
being the only origin.

---

## 3. What stays open after this

- **Residual §6.9** of `SECURITY-HARDENING.md`: at *unmatched* URLs only the fallback
  tier applies, so the 404 page's inline scripts are not hash-constrained there. Closing
  it needs either a **Cloudflare Worker/Snippet** to attach the header (no 2,000-char line
  limit) or a custom domain. Neither is done.
- **Custom domain (optional):** ~$7–15/yr, then the site gets a permanent name of its own
  and `includeSubDomains` HSTS becomes meaningful.
- **S3** (`security.txt`) still needs a disclosure contact — unrelated to hosting.
