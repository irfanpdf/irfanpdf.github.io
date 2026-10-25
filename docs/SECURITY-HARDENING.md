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
| `scripts/gen-headers.mjs` | Post-build generator. Scans every exported `out/**/*.html`, SHA-256-hashes each **executable inline script**, and writes `out/_headers` — the header file Cloudflare Pages and Netlify read from the site root. **Fail-closed:** exits non-zero (build fails) if it finds no HTML or cannot hash a single executable inline script, so a policy can never ship built from an empty set. |
| `scripts/serve-headers.mjs` | Zero-dependency local server that serves `out/` **with exactly the headers `_headers` declares**, so the policy can be exercised in a real browser before any host change. |
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
6. **This is not an audit of the site's content or an XSS test.** No penetration test,
   no SAST, no dependency audit (`npm audit` not run) was performed as part of this work.
   A CSP is defence-in-depth; a clean console does **not** prove the absence of
   vulnerabilities.
7. **`Access-Control-Allow-Origin: *`** on the live site is GitHub Pages' own default and
   cannot be removed from this repository; it disappears when the host changes.
8. **Hosting caveat:** `_headers` is understood by **Cloudflare Pages and Netlify**.
   **Vercel does not read `_headers`** — a move there would need an equivalent
   `vercel.json`, which has not been written.

## 7. Moving to a host that can send these headers (the chosen path)

Not performed — these are the steps, so the decision is executable later:

1. **Cloudflare Pages** (or **Netlify**): create the project → connect the GitHub repo
   `irfanpdf/irfanpdf.github.io`.
   - Build command: `npm run build`
   - Output directory: `out`
   - Environment variables: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DOWNLOAD_BASE_URL`
     (both currently unset — see `.env.example` and `docs/MISSING-ITEMS.md`)
   - `_headers` in the output root is applied automatically; no extra configuration.
2. **Custom domain.** A `*.github.io` name cannot be proxied through Cloudflare, so full
   headers (including `frame-ancestors`) require the site's own domain. This is also what
   `NEXT_PUBLIC_SITE_URL` is waiting for.
3. **GitHub Pages workflow** (`.github/workflows/deploy.yml`) can stay untouched during
   the transition; it simply keeps serving the header-less version.
4. **Verify after cutover** — the checks that prove it worked:
   ```powershell
   curl -I https://your-domain/            # expect CSP, nosniff, DENY, Referrer-Policy…
   node crawl.js https://your-domain       # existing route/link/asset smoke test
   ```
   and confirm the browser console stays clean on `/`, `/download/`, `/docs/`.

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
