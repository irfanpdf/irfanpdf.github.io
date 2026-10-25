# Cloudflare Pages migration — runbook for the security headers

**Status: PERFORMED 2026-10-25.** The site is live at **`https://irfanpdf.pages.dev`**
with the full header policy, verified end to end (results in §4). The steps below are
what was actually done, in order, with the values that were used — kept as the record of
the deployment and the reference for the next one (rollback, re-create, or a second
project).

**Why it was needed:** the site is served by GitHub Pages, which cannot send custom
response headers — so the browser-verified policy in
[`SECURITY-HARDENING.md`](SECURITY-HARDENING.md) was deployed but inert (finding **S1**
in [`WEBSITE-ANALYSIS.md`](WEBSITE-ANALYSIS.md)). The chosen path is **Cloudflare Pages
with no custom domain** (decision, 2026-10-25), because you don't own a domain and
`*.github.io` cannot be proxied through Cloudflare.

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

## 2. The steps (in order) — all performed 2026-10-25

### 2.1 Create the account — *done*

A free account already existed by the time this ran (session: `[previous username redacted]@[personal email redacted]`).
The one step that genuinely could not be automated was **GitHub's OAuth sign-in** when
Cloudflare asked to connect the repository — that required the `irfanpdf` account's
credentials and was completed by hand in the browser.

### 2.2 Create the Pages project — *done via the dashboard*

Path actually taken (Cloudflare's dashboard now buries Pages behind the newer
Workers+assets flow):

*Workers & Pages* → **Create application** → **"Continue to Pages"** (legacy Pages
workflow — the one that reads `_headers`) → **Import an existing Git repository** →
**Connect GitHub** (OAuth, hand-completed) → select **`irfanpdf/irfanpdf.github.io`** →
**Begin setup**.

| Setting | Value used |
|---|---|
| Project name | `irfanpdf` → **`irfanpdf.pages.dev`** |
| Production branch | `main` |
| Build command | `npm run build` (runs `next build && flatten-rsc && gen-headers`) |
| Build output directory | `out` |
| Root directory | blank (repo root) |
| Framework preset | `None` |
| Node version | env **`NODE_VERSION` = `24`** → Cloudflare installed `node-v24.22.1-linux-x64` |

### 2.3 Environment variables — *set before the first deploy, as required*

Entered in the create-project form (they live under **Settings → Environment
variables** afterwards):

| Name | Value used | Why it matters |
|---|---|---|
| `NODE_VERSION` | `24` | repo is tested on Node 24 (24.20.0 local; Cloudflare used 24.22.1) |
| `NEXT_PUBLIC_SITE_URL` | `https://irfanpdf.pages.dev` | Without it the export deliberately omits canonical/OG URLs and emits a 110-byte empty sitemap. The GitHub Pages build gets its equivalent from the Actions `SITE_URL` variable — Cloudflare has its own copy to maintain. |
| `NEXT_PUBLIC_DOWNLOAD_BASE_URL` | `https://github.com/irfanpdf/irfanpdf-releases/releases/download/v1.7.0` | Without it the download page shows "Download link not configured" instead of the three working links. |

Verified in the deployed HTML afterwards: canonical + `og:url` =
`https://irfanpdf.pages.dev/`, sitemap 2,929 B with `pages.dev` locations, all three
download hrefs pointing at the `v1.7.0` release assets, "not configured" absent.

`_headers` in `out/` is picked up automatically — **no** extra configuration, and (because
the site is a pure static export with no Pages Functions) there is no exception that would
bypass it.

### 2.4 The decision only you can make: what happens to `irfanpdf.github.io`

**Decision taken: run both.** GitHub Pages keeps serving the old URL (header-less, so old
links never break); Cloudflare serves `irfanpdf.pages.dev` with the headers, and
`NEXT_PUBLIC_SITE_URL` points canonical/OG/sitemap at the new URL so search engines
consolidate there. Verified after the cutover: `irfanpdf.github.io` → 200,
`Server: GitHub.com`, no CSP.

**Side-effect found by measuring, then FIXED the same day (2026-10-25):** the GitHub
Pages build has its own `SITE_URL` repository variable, so initially **each host declared
itself canonical** — `github.io` → `github.io`, `pages.dev` → `pages.dev` — and engines
would have seen two competing self-canonical pages instead of consolidating. Fix applied
with your approval: the GitHub Actions repository variable `SITE_URL` was changed to
`https://irfanpdf.pages.dev` (Settings → Secrets and variables → Actions → Variables) and
run #6 re-run (the first attempt had started before the variable change). Verified after
the rebuild on **both** hosts:

| | `irfanpdf.github.io` (GitHub Pages) | `irfanpdf.pages.dev` (Cloudflare) |
|---|---|---|
| canonical | `https://irfanpdf.pages.dev/` | `https://irfanpdf.pages.dev/` |
| `og:url` | `https://irfanpdf.pages.dev/` | `https://irfanpdf.pages.dev/` |
| deep page (`/features/`) | `https://irfanpdf.pages.dev/features/` | same |
| sitemap `<loc>` | 17 entries, all `pages.dev` | 17 entries, all `pages.dev` |
| CSP headers | absent (GitHub Pages limitation) | present |

Only the *URLs* the old host advertises changed — it still serves the old header-less
content at the old address, so old links keep working.

The alternatives, for the record:

| Option | Effect |
|---|---|
| **Run both** *(chosen)* | Old URL keeps working header-less; new URL carries the policy; canonical/OG/sitemap point at `pages.dev`. |
| **Disable GitHub Pages** after cutover | Old URL starts returning 404. Anywhere the old URL is written (README badges, third-party links, search index) breaks. |
| **Don't migrate** | S1 stays open forever; no headers. |

Revisit this whenever the SEO trade-off changes — it is a content call, not a security one.

### 2.5 Verify after the first deploy — *done, results in §4*

```powershell
node scripts/check-live-headers.mjs https://irfanpdf.pages.dev   # ended: OVERALL: PASS
node crawl.js https://irfanpdf.pages.dev                         # ended: OVERALL: PASS
```

Plus a browser pass: **0 "Content Security Policy" messages** on 7 routes, theme toggle,
assistant and SPA navigation working. The checker asserts, per route: every required header
present, `nosniff`/`DENY`/`Referrer-Policy` values correct, the **strict** tier (with
`sha256-` hashes) on real routes, the **catch-all** tier on an unmatched URL, a real 404
for unknown paths, and that `/_headers` itself is not downloadable.

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
- **`irfanpdf.github.io`'s fate** (§2.4): "run both" is in force; disabling GitHub Pages
  remains an SEO decision.
- **Conflicting canonicals** (§2.4): **fixed 2026-10-25** — `SITE_URL` variable changed to
  `https://irfanpdf.pages.dev`, workflow re-run, both hosts verified pointing canonical +
  `og:url` + sitemap at the new URL. Nothing further to do here.
- **Maintenance:** Cloudflare rebuilds on every push to `main`, so `gen-headers` re-runs
  there each time — no manual hash work. The `NEXT_PUBLIC_*` env vars are Cloudflare's own
  copy; if the GitHub Actions `SITE_URL`/`DOWNLOAD_BASE_URL` variables ever change, change
  both.

---

## 4. Results of the first deploy (2026-10-25)

| Evidence | Result |
|---|---|
| Deployment | **Success** — "Your project is deployed to Region: Earth", built from commit `c743f96` |
| Cloudflare's build log (the line that matters) | `gen-headers: 58 rules (1 catch-all + 57 strict per-page) / limit 100; longest line 572 chars / limit 2000` — the two-tier file survived the host's own builder; the pre-fix 2,516-char line would have been dropped |
| Node | `NODE_VERSION=24` honoured → `node-v24.22.1-linux-x64` |
| `check-live-headers.mjs https://irfanpdf.pages.dev` | **OVERALL: PASS** |
| `crawl.js https://irfanpdf.pages.dev` | **OVERALL: PASS** |
| Browser, 7 routes | **0 CSP violations / 0 console errors**; theme toggle, assistant, SPA nav work |
| Headers on `/` | `Server: cloudflare` + `CF-RAY`; CSP (both tiers, comma-joined), `nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP, `X-Permitted-Cross-Domain-Policies`, HSTS |
| Env vars | canonical/`og:url` = `pages.dev`, sitemap 2,929 B, three working download links |
| `irfanpdf.github.io` | still 200 / `Server: GitHub.com` / no CSP ("run both") |
| Canonical unification (later the same day, approved) | Actions `SITE_URL` variable changed to `https://irfanpdf.pages.dev` + run #6 re-run → **both** hosts now serve canonical/`og:url` = `pages.dev`, deep-page canonicals and the 17-entry sitemap included (evidence table in §2.4) |

**Measured quirk, recorded rather than smoothed over:** the Cloudflare (Linux) build
hashed **80 inline scripts → 21 hashes** (longest line 572) where the local (Windows)
build produced **99 → 40** (longest line 842). Cause established by diffing the HTML:
Windows `next build` emits the RSC payload as several `self.__next_f.push(...)` scripts,
Linux emits the same bytes as one large script — same content, different chunking. Safe
by construction because `gen-headers` hashes the HTML from its own build; **do not copy an
`_headers` file between the two builds.** Full write-up: `SECURITY-HARDENING.md` §5.5.

**Also observed:** `Access-Control-Allow-Origin: *` is present on `pages.dev` as well,
although our `_headers` never declares it — host default, not ours (finding S2).
