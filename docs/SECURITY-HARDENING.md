# Website security hardening — HTTP security headers

**Date:** 2026-10-25 · **Scope:** this repository only (`irfan-pdf-website`). Source
changes + local verification. **Nothing was pushed, nothing was deployed** — the live
site is unchanged. This document records what was measured, what was changed, what was
verified in a real browser, and what is deliberately left undone.

---

## 1. Starting point — what the live site actually returns (measured, not assumed)

`GET https://irfanpdf.github.io/` on 2026-10-25 (response `Date: Sun, 25 Oct 2026
06:17:16 GMT`, `Server: GitHub.com`, `Via: 1.1 varnish`, edge region `centralindia`):

| Header | Present on the live site? |
|---|---|
| `Strict-Transport-Security` | ✅ `max-age=31556952` (GitHub/Fastly adds it) |
| `Access-Control-Allow-Origin` | ⚠️ `*` (GitHub Pages default — serves every asset to every origin) |
| `Cache-Control`, `ETag`, `Age` | ✅ caching headers (GitHub default) |
| `Content-Security-Policy` | ❌ **absent** |
| `X-Content-Type-Options` | ❌ **absent** (MIME sniffing not prevented) |
| `X-Frame-Options` / `frame-ancestors` | ❌ **absent** (site can be iframed by any origin) |
| `Referrer-Policy` | ❌ **absent** |
| `Permissions-Policy` | ❌ **absent** |
| `Cross-Origin-Opener-Policy` | ❌ **absent** |
| `Cross-Origin-Resource-Policy` | ❌ **absent** |

So the live site had **no CSP, no clickjacking protection, no MIME-sniffing
protection** — that is the gap this work closes, as far as it can be closed.

## 2. Why the site could not fix this in place

| Attempted approach | Why it does not apply |
|---|---|
| `next.config.ts` → `headers()` | Only runs on a Next.js server. This site is `output: "export"` — a server that never runs. |
| GitHub Pages configuration | GitHub Pages does not support custom response headers at all. There is no setting, file or workflow that adds them. |
| `<meta http-equiv="Content-Security-Policy">` | Would carry *most* directives, but **`frame-ancestors` is ignored in `<meta>`** and `X-Frame-Options` may not be declared there — so clickjacking protection would still be missing. Chosen approach (user decision, 2026-10-25): **move to a host that can send real headers**, rather than ship a partial meta policy that a later move would have to unwind. |

**Consequence — stated plainly:** until the site is moved to such a host, `_headers`
below is generated and verified but **has no effect on the live site**. The live headers
in §1 are still what visitors receive today.

## 3. What was added

| File | Purpose |
|---|---|
| `scripts/gen-headers.mjs` | Post-build generator. Scans every exported `out/**/*.html`, SHA-256-hashes each **executable inline script**, and writes `out/_headers` — the header file Cloudflare Pages and Netlify read from the site root. Emits **two tiers of CSP** (see §4) and enforces the host's documented limits: **fail-closed** if it finds no HTML, cannot hash a single executable inline script, produces any line over **2,000 chars**, or exceeds **100 rules** — so a policy a real host would silently drop can never be written. |
| `scripts/serve-headers.mjs` | Zero-dependency local server that serves `out/` **with exactly the headers `_headers` declares**, applying Cloudflare's matching semantics (every matching rule applies; a repeated header has its values comma-joined; `_headers` itself is never served). |
| `scripts/check-live-headers.mjs` | Post-deployment prober: `node scripts/check-live-headers.mjs <base-url>` asserts every required header on six routes, that a real route carries the **strict** CSP tier, that an unmatched URL still gets the **catch-all** tier and a 404, and that `/_headers` is not downloadable. Exit 0 = pass. |
| `package.json` | `npm run build` now runs `next build && flatten-rsc && gen-headers` — the header file is produced by the same build that produced the HTML it describes, so hashes and pages cannot drift apart. |

`out/` is gitignored, so `_headers` ships as part of every build artifact, never as a
file that could go stale relative to the HTML next to it.

## 4. The policy

Directives (the full text, including all hashes, is in `out/_headers` after any build):

```
default-src 'none'
script-src 'self' 'sha256-…' ×40          ← hashes of the inline scripts actually present
style-src 'self'
style-src-attr 'unsafe-inline'            ← measured requirement, see §5
img-src 'self' data:
font-src 'self'
connect-src 'self'
manifest-src 'self'
media-src 'self'
worker-src 'none'
frame-src 'none'
object-src 'none'
base-uri 'none'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

Plus: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(),
browsing-topics=(), interest-cohort=()`,
`Cross-Origin-Opener-Policy: same-origin`,
`Cross-Origin-Resource-Policy: same-origin`,
`X-Permitted-Cross-Domain-Policies: none`,
`Strict-Transport-Security: max-age=31536000; includeSubDomains`.

### 4.1 Why the file now carries *two* CSP tiers (added 2026-10-25)

Prepared while prepping the Cloudflare Pages migration
([`CLOUDFLARE-PAGES-MIGRATION.md`](CLOUDFLARE-PAGES-MIGRATION.md)). Cloudflare documents
two hard limits for `_headers`: **100 rules** and **2,000 characters per line** — counting
indentation and the header name. Measured against our single catch-all policy:

| | chars | vs 2,000 limit |
|---|---|---|
| One `/*` policy with the union of all hashes | **2,516** | **over by 516** — the line would be dropped and the site would ship with **no CSP at all** |
| Hashes needed for the union / hashes that fit | 40 / **29** | cannot fit |
| A single page's own hashes (4–9) | **567–842** | fits |

So `_headers` is now emitted as:

| Rule | Carries |
|---|---|
| `/*` (catch-all) | all the non-CSP headers **+ a fallback CSP** identical to the above except `script-src 'self' 'unsafe-inline'` (345-char value). This is what an **unmatched URL** (a 404) receives — it still enforces `object-src`, `base-uri`, `form-action`, `frame-ancestors`, `default-src`, style/img/connect restrictions. |
| one rule per exported page (57 rules: `/`, `/x/`, `/x`, `/x/index.html` variants) | the **strict** CSP with exactly that page's hashes (572–842 chars) |

A real page matches both rules and therefore receives **two policies, which browsers
intersect (AND)**: the fallback permits any inline script, the strict policy permits only
that page's own hashes, so the effective script rule is the strict one — an injected
inline script is still blocked. This was not assumed: it was tested in a real browser
before the generator was rewritten. Serving one header value containing
`policyA, policyB` (what Cloudflare's *"values are joined with a comma separator"*
produces) ran the hashed control script and **blocked the unhashed one** with a violation
citing the strict directive — byte-for-byte the same behaviour as two separate header
fields. `serve-headers.mjs` reproduces the comma-join locally so the two tiers are
exercised before deployment, not after.

**Residual gap (honest):** at an *unmatched* URL only the catch-all applies, so the 404
page's inline scripts are not hash-constrained there. It is a static page with no URL
reflector, and it still sits behind the rest of the policy — but it is a weaker position
than a real route, and `check-live-headers.mjs` reports it as such rather than passing it
off as identical.

Rationale for the choices:

- **`default-src 'none'` first** — every fetch mode has to be named, so a future
  dependency cannot quietly start loading something unplanned; the browser will refuse
  it and the console will show it.
- **Hashes instead of `'unsafe-inline'` for scripts** — the site ships inline scripts
  (theme bootstrap, Next hydration payloads). `'unsafe-inline'` would allow *any*
  injected inline script, which is exactly what a CSP exists to stop. Hashes allow the
  scripts that exist and block every other one.
- **`worker-src 'none'` / `object-src 'none'` / `frame-src 'none'`** — the site uses no
  workers, no plugins, no frames (verified: no `iframe`/`worker`/`WebSocket`/`fetch` in
  `src/`).
- **`connect-src 'self'`** — the assistant runs entirely in the browser and fetches
  nothing; `self` covers Next's RSC prefetches (verified in §5).

## 5. Verification (all of it run locally against a browser enforcing the policy)

### 5.1 Inventory that the policy was built from

| Measurement | Result |
|---|---|
| Exported HTML files scanned | **20** |
| Executable inline scripts found | **99** → **40 unique SHA-256 hashes** |
| Hashes per page (what a strict rule carries) | **4–9** → 567–842-char lines |
| `_headers` rules emitted / limit | **58 / 100** (1 catch-all + 57 strict) |
| Longest line / limit | **842 / 2,000 chars** (the pre-fix single policy was 2,516 — over) |
| External subresource references in exported HTML (`http(s)://` in `src=`/`link href` to css/js/font, `integrity=`) | **0** |
| `fetch(` / `WebSocket` / `EventSource` / worker usage in `src/` | **0** |
| Stylesheets | 1 external (`/_next/static/chunks/*.css`), **0 `<style>` tags** |
| Images | 5 screenshots + favicon, all first-party |

### 5.2 Browser enforcement — first attempt was too strict, and that was measured

Starting policy was `style-src 'self'` alone. Result: **12 console violations**, all
`Applying inline style violates … style-src 'self'`. Inspecting the DOM showed what they
were: **14 elements carrying runtime `style` attributes** — `color-scheme: dark` on
`<html>`, per-card brand colours (`background-color:#0ea5e9` …) and Next's
`<next-route-announcer style="position: absolute;">`. These are generated at runtime and
differ per element, so they cannot be hashed.

Fix: **`style-src 'self'; style-src-attr 'unsafe-inline'`** — stylesheets stay restricted
to the site's own files (an injected `<style>` or `link` is still blocked), while style
attributes work. Re-tested: **0 violations**. Residual risk is recorded in §6.

### 5.3 Full verification run (after the fix, against a fresh build)

| Check | Result |
|---|---|
| Routes loaded under the policy (batch 1) `/`, `/download/`, `/features/`, `/how-it-works/`, `/compare/`, `/use-cases/` | **0 CSP violations**, 0 other warnings |
| Routes (batch 2) `/security/`, `/docs/`, `/docs/installation/`, `/docs/ocr-guide/`, `/docs/conversion-guide/`, `/docs/troubleshooting/` | **0 CSP violations**, 0 other warnings |
| Routes (batch 3) `/docs/faq/`, `/docs/privacy/`, `/docs/terms/`, `/docs/contact/`, `/docs/release-notes/`, `/this-route-does-not-exist/` | **0 CSP violations**; the only console message was the expected `404 (Not Found)` |
| Theme toggle (light ↔ dark) | works; persisted to `localStorage.ipdf-site-theme` |
| Site-assistant widget | opens, suggestions render, **0 violations** |
| Client-side navigation (`<Link>` click → `/features/`) | SPA route change confirmed (`performance.navigation` entries = **1**, i.e. no full reload), title updated, **33 RSC prefetch fetches all 200**, **0 violations** — proves `connect-src 'self'` and `script-src` hashes cover the router |
| Every request on every page | same-origin only (**0 external requests**) |
| Fresh `npm run build` (regenerates hashes) then 4 routes re-checked | **40 hashes served, 0 violations** — the policy and the HTML cannot drift |
| Page-load repetitions on the hardened server | **9/9 clean** |
| `npm run typecheck` | exit 0 |
| `npm run test:assistant` | **206 passed, 0 failed** |
| `npm run build` | exit 0, `gen-headers: 20 HTML, 99 scripts → 40 hashes` |

### 5.4 Re-verification after the two-tier rewrite (2026-10-25)

Everything above was re-run after `gen-headers.mjs` was changed to emit per-page rules
(§4.1) — the policy visitors would actually receive changed shape, so the evidence had to
be rebuilt, not copied:

| Check | Result |
|---|---|
| `npm run build` | exit 0 — `58 rules (1 catch-all + 57 strict) / limit 100; longest line 842 / limit 2000` |
| Line-length / rule-count audit of `out/_headers` | **124 lines, 0 over 2,000 chars, 58 rules** |
| `node scripts/check-live-headers.mjs http://127.0.0.1:8124` | **OVERALL: PASS** — 6 routes all have every required header + the strict tier (4–40 `sha256-` hashes), the unmatched URL returns 404 with the 345-char catch-all tier, `/_headers` → 404 |
| Browser, 7 real routes (`/`, `/download/`, `/docs/`, `/docs/faq/`, `/features/`, `/compare/`, `/security/`) | **0 CSP violations / 0 console errors** under the comma-joined two-tier policy |
| Browser, unmatched URL | only the expected `404 (Not Found)` message — the catch-all tier does not block the page |
| Theme toggle (dark → light) | works, `localStorage.ipdf-site-theme` updated, 0 errors |
| Site assistant opens and shows its input | works, 0 errors |
| `node crawl.js http://127.0.0.1:8124` | **OVERALL: PASS** — 347 assets, 0 failed |
| `npm run typecheck` / `npm run test:assistant` | exit 0 / **206 passed, 0 failed** |

One process note worth recording: the first run of `check-live-headers.mjs` reported two
failures because a **stale `serve-headers` process from earlier in the session was still
holding port 8124** (it had loaded the old `_headers`, and `EADDRINUSE` killed the new
server silently). Killing it and re-running gave PASS across the board. The failures were
real — they just measured the old server, not the new file.

**Honest note on a transient symptom:** during this session three loads reported
`net::ERR_INCOMPLETE_CHUNKED_ENCODING` on `/screenshots/home.png`, all in the window when
the local test server was being killed and restarted. The file itself was verified sound
over HTTP (144,719 bytes, SHA-256 `28EF79BC20AECA55D6237D7FC73BC902F1623B797F7AB8090EE675616693088`,
identical to the on-disk bytes), a direct image load succeeded, and **9 subsequent
controlled page loads produced none**. It is recorded here rather than dropped, but it
has not been reproduced outside the restart window and does not involve the headers.

## 6. Limitations and residual risk (read before calling this "done")

1. **None of this is live yet.** GitHub Pages cannot send these headers. Until the
   migration in §7 happens, visitors still receive the header set in §1. The
   `<meta>` fallback was deliberately **not** added (decision recorded in §2).
2. **`style-src-attr 'unsafe-inline'` is a real relaxation.** An attacker who already
   had an HTML-injection point could attach style attributes (CSS-basedUI redressing,
   and in narrow cases attribute-selector data exfiltration). It does **not** allow
   script execution, and stylesheet loading stays `'self'`. The alternative — covering
   runtime style attributes with hashes — is impossible for values generated per
   element, and `'unsafe-hashes'` would be no safer in practice.
3. **`img-src data:`** is allowed for data-URI images. No such image exists today; it is
   kept because Next image/error paths emit them and blocking them breaks error states.
4. **HSTS `includeSubDomains`** is only meaningful once the site is on its own HTTPS
   domain; it will then apply to *all* subdomains of that domain, so any future
   subdomain that needs plain HTTP would be affected. Remove `includeSubDomains` if that
   is ever a concern.
5. **No CSP reporting endpoint.** There is no backend to receive `report-uri` reports, so
   violations are visible only in the visitor's console. `Report-Only` mode was not
   enabled for the same reason.
6. **This is not an audit of the site's content or an XSS test.** No penetration test and
   no SAST were performed as part of this work. `npm audit` *was* run on 2026-10-25 and
   reported **0 vulnerabilities** (production and dev), but a dependency audit is not a
   security assessment. A CSP is defence-in-depth; a clean console does **not** prove the
   absence of vulnerabilities.
7. **`Access-Control-Allow-Origin: *`** on the live site is GitHub Pages' own default and
   cannot be removed from this repository; it disappears when the host changes.
8. **Hosting caveat:** `_headers` is understood by **Cloudflare Pages and Netlify**.
   **Vercel does not read `_headers`** — a move there would need an equivalent
   `vercel.json`, which has not been written.
9. **The catch-all tier is deliberately weaker (added 2026-10-25).** Because Cloudflare
   caps `_headers` lines at 2,000 chars, the strict hash list cannot live on `/*`; only
   real routes carry it. At an unmatched URL the fallback policy applies, and its
   `script-src 'self' 'unsafe-inline'` means inline script there is **not** hash-checked.
   Everything else in the policy (no objects, no frames, no base, `frame-ancestors 'none'`,
   same-origin-only styles/images/connect) still applies. Closing this entirely would mean
   either a host-side rewrite (Cloudflare Worker/Snippet, no line limit) or a custom
   domain — both recorded in §7.

## 7. Moving to a host that can send these headers (the chosen path)

**Decision 2026-10-25: Cloudflare Pages (option A — no custom domain).** Full, step-by-step
runbook, including the env vars, the `_headers` limits this file now respects, and the
still-open question of what happens to `irfanpdf.github.io`, is in
[`CLOUDFLARE-PAGES-MIGRATION.md`](CLOUDFLARE-PAGES-MIGRATION.md). Summary:

1. **Not performed** — it needs a Cloudflare account that does not exist yet.
2. **Cloudflare Pages** reads `out/_headers` natively: build command `npm run build`,
   output directory `out`, Node 20+. The `_headers` file now fits the host's documented
   limits (§4.1), so the policy that was verified locally is the policy visitors get.
3. **No custom domain is required for the headers** — this corrects an earlier version of
   this section, which said a domain was needed. That is only true for *proxying*
   `github.io` through Cloudflare (Transform Rules need a zone you own). On Pages,
   `_headers` works on the free `*.pages.dev` name. A domain remains optional, and would
   be needed later only to close residual item §6.9.
4. **GitHub Pages workflow** (`.github/workflows/deploy.yml`) stays untouched during the
   transition; it keeps serving the header-less version at the old URL. The SEO
   consequences of running both are the one decision this repo cannot make — see the
   migration doc.
5. **Verify after cutover** with the checker that already exists:
   ```powershell
   node scripts/check-live-headers.mjs https://<your-pages-domain>   # must end OVERALL: PASS
   node crawl.js https://<your-pages-domain>                         # route/link/asset smoke test
   ```
   plus a browser console read on `/`, `/download/`, `/docs/` (0 CSP violations).

## 8. How to re-run this verification

```powershell
npm run build                       # regenerates out/_headers (fails closed if it can't)
node scripts/serve-headers.mjs      # serves out/ with the real headers on :8124
# then load http://127.0.0.1:8124/ in a browser and read the console:
#   0 "Content Security Policy" messages = policy and HTML still agree
```

If a future build legitimately introduces a new inline script, `gen-headers` picks it up
automatically — no manual hash maintenance. If it cannot, the build fails instead of
shipping a policy that would break the site.

---

**Status:** source hardened and locally verified · **live site unchanged** ·
**host migration outstanding** (§7) · no 100%-security claim implied (§6).
