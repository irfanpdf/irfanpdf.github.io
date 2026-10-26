# Full-site analysis — security, dependencies, content integrity, SEO, exposure

**Date:** 2026-10-25 · **Method:** read-only inspection of the repository and the live
deployment, plus live HTTP probes, a public-artifact download, and the already-built
site served locally. Where a claim could not be checked, it says so.

**Follow-ups applied the same day (2026-10-25), each re-verified after the change:**
**P1** — fix-forward redaction of the username paths (29 occurrences across 6 files);
**D1** — `next` 16.4.2 → 16.4.3 with a full rebuild + typecheck + assistant tests +
browser-under-CSP checks + crawl. The findings below are written as first found, with the
remediation status noted in each section. Nothing was deployed; nothing was pushed.

---

## 1. Verdict at a glance

| Area | Result |
|---|---|
| Secrets / credentials in repo or history | ✅ **none found** (only empty `.env.example`, and only that file was ever added) |
| Personal data in repo | ✅ **fixed forward 2026-10-25** — 29 username occurrences removed from the working tree; the pushed history still has them — see **P1** |
| Dependency vulnerabilities (`npm audit`) | ✅ **0 vulnerabilities** (production *and* dev); `next` 16.4.3, `react`/`react-dom` 19.3.1, `typescript` 7.0.2, `@types/node` 26.6.5 — **no dependency is behind latest any more** (2026-10-25), see **D1** |
| Live security headers | ✅ **live at `https://irfanpdf.pages.dev`** since 2026-10-25 (all required headers + hashed CSP, verified in a browser) — **S1 fixed**; legacy `irfanpdf.github.io` still header-less by the "run both" decision |
| Published download hashes vs real files | ✅ **3/3 match**; the publicly downloadable file hashes to the site's published value |
| Live download links | ✅ resolve **200** with exactly the published byte sizes |
| Tracking / cookies / third-party requests | ✅ **none** — no cookies on 3 probed routes, 0 external subresources, 0 mixed content |
| Source/config exposure on the host | ✅ `/.git`, `/package.json`, `/.env`, `/README.md`, `/docs/*` all **404** |
| SEO metadata | ✅ canonical, 9 Open Graph tags, `index,follow`, sitemap with 17 URLs, robots points at it — and after the 2026-10-25 canonical fix **both hosts advertise the same canonical** (`pages.dev`), so engines consolidate on the new URL instead of seeing duplicates (earlier that day each host self-canonicalised; found by measurement, fixed via the Actions `SITE_URL` variable — evidence in `CLOUDFLARE-PAGES-MIGRATION.md` §2.4) |
| 404 behaviour | ✅ unknown route returns **404** |
| Responsible-disclosure channel | ✅ **live 2026-10-25** — `security.txt` at `/.well-known/security.txt` **and** `/security.txt`, 200 on both hosts with all RFC 9116 fields; Contact → the repo's private-vulnerability-reporting form (feature enabled, URL verified loading) — **S3 fixed** |

---

## 2. Findings (severity-ordered)

### P1 — MEDIUM (privacy): the public repository exposes the local Windows username

The repository `irfanpdf/irfanpdf.github.io` is **public** (`visibility: public`,
`private: false`, pushed 2026-10-23). Confirmed present **on `origin/main`**, i.e. in the
already-pushed history, not just locally:

| File:line | Content |
|---|---|
| `README.md:8` | `` The application itself lives at `C:\Users\<local-user>\Desktop\docuforge` `` |
| `README.md:18` | `` cd C:\Users\<local-user>\Desktop\irfan-pdf-website `` |
| `docs/PUBLISH-GITHUB.md:39` | `` cd C:\Users\<local-user>\Desktop\irfan-pdf-website `` |
| `docs/PUBLISH-GITHUB.md:74` | `` Attach the three artifacts from `C:\Users\<local-user>\Desktop\docuforge\dist\` `` |
| `docs/VERIFICATION-REPORT.md:4` | `` **Subject:** `C:\Users\<local-user>\Desktop\docuforge` `` |

*(The table shows `<local-user>` in place of the actual Windows user-name string, so
this report does not repeat the very value it is reporting on. As pushed on
`origin/main`, the real name is in these five lines — plus, less obviously, in the three
`docs/evidence/regression-gate-2026-10-17-*.txt` logs (8 occurrences each, 24 total).
Those logs are **UTF-16**, which git classifies as binary, so a plain `git grep -I` scan
silently skips them — the counts below come from a byte-level scan of every tracked file
in both encodings, not from `git grep`.)*

**Total: 29 occurrences in 6 tracked files**, all present on `origin/main`.

**What this leaks:** the machine's user name and the directory layout of the
private application source. Not credentials, not the application source itself (that
repository has **no remote at all** and is not public — verified below).

**Remediation — decision taken 2026-10-25: fix forward only.**

* The five documentation lines were rewritten with placeholders (sibling-folder /
  `<checkout-path>` / `<path-to>`), so every future commit and checkout is clean.
* The three evidence logs were redacted too: the user-name substring was replaced with
  `local-user` (24 substitutions). **Nothing else in those logs changed** — same
  UTF-16 encoding, same line counts (1827 / 1831 / 1827), same test results; only the
  user name inside path strings was substituted. The substitution rule is stated here
  rather than inside the logs so the raw output stays raw.
* A repeat byte-level scan of the whole working tree returns **0 occurrences**.

The strings **remain in the pushed history** (a later `git filter-repo` rewrite +
force-push would remove them; deliberately not done — it rewrites every commit hash on a
public repo and any existing clone keeps the old copy). History rewrite remains a
recorded open option (§7 item 1).

### S1 — MEDIUM (security headers): ~~the live site still has no CSP~~ → **FIXED, verified live 2026-10-25**

**As found (2026-10-25, on GitHub Pages):** re-measured on three routes
(`/`, `/download/`, `/docs/`): `Content-Security-Policy`, `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` **all absent**; `Set-Cookie`
absent; GitHub adds `Strict-Transport-Security`; `Access-Control-Allow-Origin: *` is
GitHub's default.

**Remediation, completed the same day:** the browser-verified policy from
[`SECURITY-HARDENING.md`](SECURITY-HARDENING.md) now ships. Preparing the move exposed a
blocker that would have silently defeated it — Cloudflare caps every `_headers` line at
**2,000 chars**, and the policy as originally written was **2,516** (40 hashes; only 29
fit) — so `gen-headers.mjs` was rewritten to emit a catch-all tier plus one strict
per-page tier, with the build failing if either the line or rule-count limit would be
exceeded, and the comma-join intersection it relies on was proven in a real browser first.

**Live proof (production URL, not localhost):**

- Cloudflare's own build log carries the generator's limits line
  (`58 rules … longest line 572 chars / limit 2000`);
- `node scripts/check-live-headers.mjs https://irfanpdf.pages.dev` → **OVERALL: PASS**
  (6 routes with every required header + strict `sha256-` tier, catch-all tier + 404 on an
  unmatched URL, `/_headers` not downloadable);
- browser pass on 7 routes → **0 CSP violations / 0 console errors**; theme toggle, site
  assistant and SPA navigation all work under the live policy;
- `node crawl.js https://irfanpdf.pages.dev` → **PASS**; canonical/OG/sitemap and the
  three download links all picked up the build-time env vars.

**Same-day follow-up (2026-10-25, `3f204c5`):** the catch-all tier's residual gap was
closed in-repo — it now carries the **union of all hashes** instead of `unsafe-inline`
when that fits the 2,000-char line, and the deployed Linux build fits (live measured
1,463 chars / 21 hashes; checker PASS without flags; the live 404 page's inline scripts
run under it). Windows local builds also produce the strong catch-all now — a
post-build inline-script merge step (`scripts/merge-inline-scripts.mjs`) took the
Windows union from 40 hashes / 2,516 chars to 20 / 1,409, so no build falls back any
more. Full measurements:
[`SECURITY-HARDENING.md`](SECURITY-HARDENING.md) §6 item 9.

**Residual:** `irfanpdf.github.io` keeps serving the old header-less copy under the "run
both" decision (so old links never break) — anyone on that URL still gets no CSP, and the
`<meta>` fallback remains deliberately not added. **One SEO side-effect measured after the
cutover, then fixed the same day:** each host had declared *itself* canonical
(`github.io` → `github.io`, `pages.dev` → `pages.dev`), so engines were not consolidating
onto the new URL as the "run both" plan assumed. Fixed with approval by changing the
GitHub Actions `SITE_URL` variable to `https://irfanpdf.pages.dev` and re-running run #6;
verified afterwards that **both** hosts now serve canonical + `og:url` = `pages.dev`
(including deep-page canonicals and the 17-entry sitemap). Details in
`CLOUDFLARE-PAGES-MIGRATION.md` §2.4; the measured Windows/Linux build difference:
`SECURITY-HARDENING.md` §5.5, §6.1.

### S2 — LOW: `Access-Control-Allow-Origin: *` on every response

GitHub Pages serves the site's assets to any origin and this cannot be configured away
from the repository. **Re-measured after the host move: still present on
`irfanpdf.pages.dev`**, and it is not something our `_headers` declares — so it appears to
be the new host's default as well. Not fixed; recorded as observed (the exact
Cloudflare-side mechanism was not verified).

### S3 — LOW: no responsible-disclosure contact → **FIXED, verified live 2026-10-25**

**As found:** `/.well-known/security.txt` → 404, `/security.txt` → 404. The contact page
itself states no *support* channel exists (`docs/MISSING-ITEMS.md` item 4). A security
researcher who finds a problem on either public repo had no way to report it.

**Fix, using a contact that exists without publishing an email:** GitHub's **private
vulnerability reporting** was **enabled in the repository settings** (Settings → Code
security → Private vulnerability reporting → Enable), and the contact chosen for
`security.txt` is the repository's own draft-advisory form:

```
Contact: https://github.com/irfanpdf/irfanpdf.github.io/security/advisories/new
```

That URL was opened in a browser after enabling the feature and **loads the "Draft
Advisory" form** (not a 404), so the published contact is verified to work before it is
advertised.

**Files added** (identical content, both locations so either convention resolves):

| File | Why |
|---|---|
| `public/.well-known/security.txt` | the location RFC 9116 standardises |
| `public/security.txt` | legacy root location, which search engines and scanners also probe |

Contents (RFC 9116 fields; no BOM, LF endings, 293 bytes):

```
Contact: https://github.com/irfanpdf/irfanpdf.github.io/security/advisories/new
Expires: 2027-10-24T00:00:00.000Z
Preferred-Languages: en
Canonical: https://irfanpdf.pages.dev/.well-known/security.txt
Policy: https://github.com/irfanpdf/irfanpdf.github.io/blob/main/docs/SECURITY-HARDENING.md
```

**Verified locally** (2026-10-25, hardened server): both URLs → **200**,
`text/plain; charset=utf-8`, byte-identical to the source files, all five RFC fields
present, `Expires` within the 1-year limit, and `check-live-headers` + `crawl` still
**OVERALL: PASS** with the new files in the export.

**Verified live after the deploy** (2026-10-25, both hosts, same day):

| Check | Result |
|---|---|
| `/.well-known/security.txt` on `pages.dev` **and** `github.io` | **200**, 293 B |
| `/security.txt` (legacy root) on both hosts | **200**, 293 B |
| Content | **byte-identical** to the source file on both hosts (no BOM, LF) |
| All five RFC 9116 fields (`Contact`, `Expires`, `Canonical`, `Policy`, `Preferred-Languages`) | present; `Expires 2027-10-24` within the 1-year limit |
| Contact URL | loads GitHub's "Draft Advisory" form (verified in a browser after enabling private vulnerability reporting) |

**Not changed:** this is a *security* contact only. The general support-channel gap
(MISSING-ITEMS item 4, the contact/FAQ/troubleshooting pages' "no support channel is
published" wording) is a separate, still-open item — a bug report and a support request
are different things, and only the former now has a route.

### D1 — LOW (dependencies): 0 vulnerabilities; `next` patched 2026-10-25

```
npm audit --omit=dev  →  found 0 vulnerabilities   (re-run after the update: still 0)
npm audit             →  found 0 vulnerabilities   (re-run after the update: still 0)
```

| Package | Installed (at analysis) | Latest | Kind |
|---|---|---|---|
| `next` | 16.4.2 | 16.4.3 | patch behind — framework (runtime) → **updated 2026-10-25** |
| `react` / `react-dom` | 19.2.0 | 19.3.1 | minor behind (runtime) → **updated 2026-10-25 (second pass, see below)** |
| `typescript` | 5.9.3 | 7.0.2 | major behind (**dev only**) → **updated 2026-10-25 (third pass, see below)** |
| `@types/node` | 24.19.2 | 26.6.5 | major behind (**dev only**) → **updated 2026-10-25 (third pass, see below)** |
| `tailwindcss` | 4.3.3 | current | up to date |

CI installs with `npm ci`, so the lockfile is authoritative. Nothing here is urgent —
`npm audit` is clean — but `next 16.4.3` is a framework patch and the usual practice is
to take it.

**Applied 2026-10-25 (`next` 16.4.2 → 16.4.3, framework patch only; react and the
dev-only majors deliberately left alone).** Re-verified after the update:

| Check | Result |
|---|---|
| `npm install next@16.4.3` | ✅ `package.json` → `^16.4.3`, lockfile → 16.4.3, 0 vulnerabilities |
| `npm run typecheck` | ✅ exit 0, no errors |
| `npm run test:assistant` | ✅ **206 passed, 0 failed** |
| `npm run build` (incl. `gen-headers`) | ✅ exit 0 — 20 HTML files, 99 inline scripts → **40 unique SHA-256 hashes**, `out/_headers` rewritten (CSP header value 2489 chars — the *pre-two-tier* single policy; the file was restructured into catch-all + per-page tiers later the same day because of Cloudflare's 2,000-char line limit, see **S1**) |
| Headers on 6 routes (`/`, `/download/`, `/docs/`, `/features/`, `/security/`, `/404.html`) | ✅ all 200 with CSP + `nosniff` + `X-Frame-Options: DENY` + `Referrer-Policy` + `Permissions-Policy` + HSTS |
| Browser console under that CSP — 5 routes | ✅ **0 errors / 0 CSP violations** |
| SPA navigation (`Explore all features` → `/features/`) | ✅ client-side route change, 0 errors |
| Theme toggle (light → dark, `localStorage` updated) | ✅ works, 0 errors |
| Site assistant (asked a real question) | ✅ opens, submits, replies, suggestions render, 0 errors |
| `node crawl.js http://127.0.0.1:8124` | ✅ **OVERALL: PASS** — 347 assets, 0 failed; 404/robots/sitemap/content checks all PASS |

**Second pass applied 2026-10-25 (`react` / `react-dom` 19.2.0 → 19.3.1 — the runtime
minor that the first pass deliberately left alone, approved for update).** Kept
exact-pinned (no caret) as the repo already did. Re-verified end to end:

| Check | Result |
|---|---|
| `npm install react@19.3.1 react-dom@19.3.1` | ✅ `package.json` exact `19.3.1`, lockfile `19.3.1`, **0 vulnerabilities** (prod + dev) |
| `npm run typecheck` | ✅ exit 0, no errors (`@types/react` satisfies `^19`) |
| `npm run test:assistant` | ✅ **206 passed, 0 failed** |
| `npm run build` (incl. `flatten-rsc` + `gen-headers`) | ✅ exit 0 — **same hash shape as before the upgrade**: 99 inline scripts → 40 unique hashes, 58 rules, longest line 842 — i.e. the new react emitted byte-identical inline script structure, so the CSP policy did not change |
| `check-live-headers.mjs http://127.0.0.1:8124` | ✅ **OVERALL: PASS** — every required header, strict tier on real routes, catch-all tier + 404 on the unmatched URL, `/_headers` not served |
| `node crawl.js http://127.0.0.1:8124` | ✅ **OVERALL: PASS** |
| Browser, 8 routes (7 real + unmatched) | ✅ **0 CSP violations**; 3 routes showed a transient `502` on the first pass, an immediate re-read of the same routes showed **0 errors and 0 failed resources** (navigation-loop race against the local server, not a page defect — the crawl's 347 assets all succeeded) |
| Theme toggle (→ dark, `localStorage.ipdf-site-theme` updated) | ✅ works, 0 errors |
| SPA navigation `/` → `/download/` | ✅ client-side route change, 0 errors |
| Site assistant (asked *"How do I compress a PDF?"*) | ✅ opens, accepts input, replies (502-char response), 0 errors |

**Live verification of the same build after deploy** (2026-10-25, `98d04aa`, both hosts):

| Check | Result |
|---|---|
| GitHub Actions run #8 | ✅ `conclusion: success` (github.io rebuilt with react 19.3.1) |
| Cloudflare deploy | ✅ new build serving (proved by `security.txt`, a file that exists only in this build, returning 200 on `pages.dev`) |
| `check-live-headers.mjs https://irfanpdf.pages.dev` | ✅ **OVERALL: PASS** — the regenerated two-tier `_headers` still applies |
| `node crawl.js https://irfanpdf.pages.dev` | ✅ **OVERALL: PASS** |
| Browser, 8 routes on production | ✅ **0 CSP violations** (only the expected 404 on the bogus path) |
| Theme toggle / SPA nav `/` → `/features/` / assistant reply | ✅ all working, 0 errors. *Honest note:* an earlier combined script reported the SPA link "landing on `/`" — that was the script reading the URL while the theme toggle was still re-rendering; an isolated re-test navigated correctly to `/features/` with 0 errors |

**Third pass applied 2026-10-25 (the dev-only majors that the first two passes deliberately left alone): `typescript` 5.9.3 → 7.0.2 and `@types/node` 24.19.2 → 26.6.5.**

| Check | Result |
|---|---|
| `npm install -D typescript@7.0.2 @types/node@26.6.5` | ✅ `package.json` + lockfile updated, **0 vulnerabilities** (prod + dev) |
| `npm run typecheck` (now `tsc` 7.0.2, the native checker) | ✅ exit 0 — the TS 7 checker accepted the codebase with no new diagnostics |
| `npm run test:assistant` | ⚠️ → ✅ **206 passed, 0 failed** — but the harness needed fixing first, honestly recorded: **typescript 7 ships no JavaScript compiler API at all** (the package root exports only `version` strings; the compiler is a native binary and even a full grep of the package finds no `transpileModule`), so the old `ts.transpileModule` loader crashed with `TypeError: Cannot read properties of undefined (reading 'CommonJS')`. `scripts/test-assistant.mjs` is now **dual-mode**: if the installed typescript still exposes the classic API it transpiles in memory exactly as before; otherwise the `.ts` files are imported as-is and **Node's built-in type stripping** removes the types, with a `module.registerHooks()` resolve hook mapping the tsconfig `@/*` alias. Still zero extra dependencies; the first mode is kept so downgrading typescript also works |
| `npm run build` (incl. `flatten-rsc`, `merge-inline-scripts`, `gen-headers`) | ✅ exit 0 — 99 inline scripts → 60 after the merge step → **20 unique SHA-256 hashes**, 58 rules, longest line 1436 — and because the union now fits, the catch-all is emitted **strong** on Windows too (`1409 chars (strong: 20 hashes, no unsafe-inline)`), no fallback warning. Browser re-verified over 9 routes: **0 CSP violations**, theme/SPA/assistant all working |
| Runtime impact | **none** — both packages are dev-only; `dependencies` untouched (`next` 16.4.3, `react`/`react-dom` 19.3.1), so the deployed bytes cannot change from this |
| `@types/node` 26 vs CI's Node 20 | types are dev-only and never shipped; noted honestly: CI (`deploy.yml`) builds on **Node 20**, so the *build* behaviour of these new deps on Node 20/Linux is **verified only when this commit is pushed** — recorded in the commit, not claimed here |

---

## 3. What was verified as correct

### 3.1 Content integrity — the site's numbers are true

| Check | Result |
|---|---|
| Published SHA-256 for `IrfanPDF_Setup_1.7.0.exe` vs the real file in `docuforge\dist` | ✅ **MATCH** |
| Published SHA-256 for `IRFAN-PDF-PROFESSIONAL.zip` vs the real file | ✅ **MATCH** |
| Published SHA-256 for `IrfanPDF_Portable.zip` vs the real file | ✅ **MATCH** |
| Published byte sizes vs real file sizes (115,995,494 / 155,787,006 / 7,705,955) | ✅ **3/3 exact** |
| **Downloaded the publicly served `IrfanPDF_Portable.zip` from GitHub Releases and hashed it** | ✅ `72EAA801…BA8FD98` = the value the site publishes → the *public* artifact matches the site's claim, not just the local copy |
| **Downloaded the two LARGE public artifacts from GitHub Releases and hashed them** | ✅ **both MATCH** (2026-10-25): `IrfanPDF_Setup_1.7.0.exe` → 115,995,494 bytes = exact, SHA-256 `C57968BA…0A7C5` = published value; `IRFAN-PDF-PROFESSIONAL.zip` → 155,787,006 bytes = exact, SHA-256 `02B95E24…97F4D9` = published value. **All 3/3 public artifacts are now byte-verified against what the site publishes** |
| Version/date claims (`version: 1.7.0`, `releaseDate: 2026-10-11`) vs `docuforge\CHANGELOG.md` (`## 1.7.0 final build - 2026-10-11`) | ✅ match |
| Site claim "43 of 43 suites passing" vs the application's regression gate | ✅ consistent (all 43 suites pass locally) |

*Previously not verified:* the hashes of the two large public artifacts (110.6 MiB /
148.6 MiB) were only checked against their HTTP `Content-Length`. **Closed 2026-10-25:**
both were downloaded in full from the release and SHA-256'd — sizes exact and hashes
**MATCH** the published values (row above), so all three public artifacts are now
byte-verified end to end.

### 3.2 Download links (live)

All three point at `https://github.com/irfanpdf/irfanpdf-releases/releases/download/v1.7.0/…`
and each returns **200** with `Content-Length` equal to the size the site prints. So
`NEXT_PUBLIC_DOWNLOAD_BASE_URL` **is** configured in the GitHub Actions variables (the
local `.env.example` being empty is by design — see README note 1).

### 3.3 Live deployment hygiene

| Probe | Result |
|---|---|
| `/.git/HEAD`, `/.git/config` | 404 |
| `/package.json`, `/package-lock.json` | 404 |
| `/.env`, `/.env.local` | 404 |
| `/README.md`, `/crawl.js`, `/docs/SECURITY-HARDENING.md`, `/.github/workflows/deploy.yml` | 404 |
| `/out/`, `/node_modules/`, `/.DS_Store`, `/backup.zip`, `/console` | 404 |
| `/sitemap.xml`, `/robots.txt`, `/favicon.ico`, `/404.html` | 200 (intended) |
| Unknown route `/this-route-does-not-exist/` | **404** |
| `http://irfanpdf.github.io/` | **301** → https |
| Cookies on `/`, `/download/`, `/docs/` | **none** (`Set-Cookie` absent) |
| Mixed content (`http://` subresources) | **0** |
| Preconnect / dns-prefetch to third parties | **none** |

Only the built site is published — the source, the docs and the git history are not
served.

### 3.4 Privacy of the running site

- **No cookies, no analytics, no tracking pixels** — the only storage is
  `localStorage.ipdf-site-theme` (light/dark), documented on the privacy page.
- **Zero external subresources** in the live home HTML (one `href` to its own origin);
  **8 script tags, all first-party**; 1 stylesheet; 3 images.
- The site assistant runs entirely in the browser — `src/` contains **no `fetch(`, no
  `WebSocket`, no `EventSource`, no worker**, so nothing a visitor types can leave the
  page. This confirms the site's own claim rather than repeating it.

### 3.5 Source review (website code)

| Pattern searched | Result |
|---|---|
| `eval(` / `new Function` / `document.write` / `innerHTML` | **0** |
| `dangerouslySetInnerHTML` | 2 — both in `layout.tsx`: the first-party theme bootstrap and the JSON-LD constant. No user input is ever interpolated. |
| `target="_blank"` without `rel="noopener"` | **0** — the one external link carries `rel="noopener noreferrer nofollow"` |
| Forms / auth / payment code | **none** (no `<form>` anywhere) |
| Hard-coded credentials (`ghp_`, `sk-`, `BEGIN PRIVATE KEY`, `api_key`, email addresses) | **0** in tracked files; git history ever added only `.env.example` (empty values) |

### 3.6 SEO / structure

- `<link rel="canonical" href="https://irfanpdf.pages.dev/">` ✅ *(measured when §3.6 was
  written, this read `https://irfanpdf.github.io/`; after the Cloudflare Pages move and
  the canonical fix of 2026-10-25 it reads `pages.dev` on both hosts — see S1)*
- 9 Open Graph tags incl. `og:url` and `og:image` ✅
- `<meta name="robots" content="index, follow">` ✅ (the 404 page stays `noindex`)
- `robots.txt` → `User-Agent: * / Allow: /` + `Sitemap:` line ✅
- `sitemap.xml` → **17 `<loc>` entries** ✅

**Live vs local HTML differ (126,862 vs 125,835 bytes) — explained, not a defect:** the
CI build sets `NEXT_PUBLIC_SITE_URL`, the local build does not, so the live page carries
canonical/OG URLs and a 2,929-byte sitemap while the local export correctly omits them
(110-byte empty sitemap). This is the documented "never guess the domain" behaviour.

---

## 4. Performance (measured earlier; not re-run today)

From [`TESTING-REPORT.md`](TESTING-REPORT.md) §6 (2026-10-17/22 runs): home TTFB 300 ms,
DOMContentLoaded 709 ms, 645 KB transferred (454 KB script); `/docs/faq` 504 KB; static
payload 149 files / 4.7 MB; Lighthouse accessibility 1.00 on 17 pages in light *and*
dark. **Core Web Vitals (LCP/INP/CLS) are marked NOT VERIFIED there** — no field data
exists for an undeployed build, and that remains true.

Measured fresh today from the local export: `out/` = 5,068,857 bytes total, home HTML
125,835 B, JS 649,584 B across 13 files, CSS 47,157 B, screenshots 440,143 B.

---

## 5. External links (listed by the site, not fetched by it)

The comparison page cites 10 third-party URLs with fetch dates. Re-probed today from this
machine:

| URL | Result |
|---|---|
| `pdf-xchange.com/product/…` | 200 |
| `tools.pdf24.org/en/creator` | 200 |
| `adobe.com/acrobat.html` | **403** — Adobe blocks automated clients; the link still works in a browser |
| `foxit.com/pdf-editor/pricing/` | **no response** (timeout/blocked from this network) |

Neither failure is a site defect — these are citation links the page only *displays* —
but the two unreachable results are recorded rather than assumed fine.

---

## 6. Scope of what is public today

| Repository | Visibility | Contains |
|---|---|---|
| `irfanpdf/irfanpdf.github.io` | **public** | website source + docs (**did expose local username paths — P1, fixed forward 2026-10-25; still present in pushed history**) |
| `irfanpdf/irfanpdf-releases` | **public** | the three v1.7.0 installers |
| `docuforge` (application source) | **no remote configured** — not published anywhere | source, security docs, dist |

`npm audit` clean · 0 cookies · 0 third-party requests · 0 secrets · hashes verified end
to end from the public download back to the local artifact.

---

## 7. Open actions

1. **P1** — fix-forward **done** (2026-10-25, 29 occurrences in 6 files removed from the
   working tree; §2). Still open: the strings sit in the pushed history until a
   `git filter-repo` rewrite + force-push, which remains optional and unperformed.
2. **S1** — migrate hosting so the committed `_headers` policy takes effect.
   **DONE 2026-10-25**: deployed to Cloudflare Pages (`https://irfanpdf.pages.dev`) and
   verified live end to end (build-log limits line, `check-live-headers` OVERALL: PASS,
   crawl PASS, browser 0 CSP violations on 7 routes) — evidence in
   `SECURITY-HARDENING.md` §5.5, steps in
   [`CLOUDFLARE-PAGES-MIGRATION.md`](CLOUDFLARE-PAGES-MIGRATION.md). Deliberately left
   running alongside `irfanpdf.github.io` ("run both" decision), so the old URL stays
   header-less until you decide its SEO fate.
3. **S3** — add `security.txt` once a contact address exists. **DONE 2026-10-25**:
   GitHub private vulnerability reporting enabled, `security.txt` added at both
   locations, local + live verification on both hosts all passing (§2 S3).
4. **D1** — **all done 2026-10-25** (three passes, each with its own full
   re-verification in §2 D1): `next@16.4.3`, `react`/`react-dom` 19.3.1, and the
   dev-only majors `typescript@7.0.2` / `@types/node@26.6.5` — the last needed a
   test-harness fix because TS 7 removed the JS compiler API (recorded in §2 D1).
   **No dependency is behind latest any more.**
5. Re-hash the two large public artifacts if byte-level confirmation of all three is
   wanted (§3.1). **DONE 2026-10-25** — both downloaded and hashed: sizes exact,
   SHA-256 **MATCH** (§3.1); all 3/3 public artifacts byte-verified.
