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
| `scripts/merge-inline-scripts.mjs` | Runs between `flatten-rsc` and `gen-headers`. Joins each run of **adjacent inline scripts** (whitespace-only gap, same type, no attributes other than `type`) into one `<script>` element, preserving execution order, so the export carries fewer hashes: Windows 40 → 20 unique hashes, catch-all 2,516 → **1,409 chars** (under the limit). Refuses any merge that would drop an attribute or produce `</script>` in a body (fail-closed), and leaves every other byte untouched. |
| `scripts/serve-headers.mjs` | Zero-dependency local server that serves `out/` **with exactly the headers `_headers` declares**, applying Cloudflare's matching semantics (every matching rule applies; a repeated header has its values comma-joined; `_headers` itself is never served). |
| `scripts/check-live-headers.mjs` | Post-deployment prober: `node scripts/check-live-headers.mjs <base-url>` asserts every required header on six routes, that a real route carries the **strict** CSP tier, that an unmatched URL still gets the **catch-all** tier **and that this tier is hash-constrained (strong mode: `sha256-` present and no `unsafe-inline` **in `script-src`** — scoped to that directive, since `style-src-attr 'unsafe-inline'` is present by design)** — the check that proves residual §6.9 closed — and that `/_headers` is not downloadable. Pass `--allow-fallback` only as a deliberate override: since `scripts/merge-inline-scripts.mjs` joined the build, no normal build needs it (both platforms fit the line), but if a build's union ever outgrows 2,000 chars again `gen-headers` falls back and this flag is the sole, explicit way to accept that — without it a fallback is a **FAIL**. Exit 0 = pass. |
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
| `/*` (catch-all) | all the non-CSP headers **+ the catch-all CSP**, whose `script-src` carries the **union of every hash in the export** when that fits the 2,000-char line (**strong mode** — both platforms fit today: Linux ~1,463 chars pre-merge-era, Windows 1,409 chars / 20 hashes after `merge-inline-scripts`), falling back to `script-src 'self' 'unsafe-inline'` with a loud build-log warning only if a build's union outgrows the line again — see §6 item 9. This is what an **unmatched URL** (a 404) receives; it also enforces `object-src`, `base-uri`, `form-action`, `frame-ancestors`, `default-src`, style/img/connect restrictions either way. |
| one rule per exported page (57 rules: `/`, `/x/`, `/x`, `/x/index.html` variants) | the **strict** CSP with exactly that page's hashes (572–842 chars before the inline-script merge step, **518** after it — every page then carries the same 3 script groups) |

A real page matches both rules and therefore receives **two policies, which browsers
intersect (AND)**: a script must pass the catch-all **and** the strict policy. In strong
mode the catch-all itself only allows the build's own hashes (the union, which includes
that page's); in fallback mode it permits any inline script while the strict policy
permits only that page's own hashes — so in **both** modes the effective script rule on a
real page is the strict one, and an injected inline script is blocked. This was not
assumed: it was tested in a real browser
before the generator was rewritten. Serving one header value containing
`policyA, policyB` (what Cloudflare's *"values are joined with a comma separator"*
produces) ran the hashed control script and **blocked the unhashed one** with a violation
citing the strict directive — byte-for-byte the same behaviour as two separate header
fields. `serve-headers.mjs` reproduces the comma-join locally so the two tiers are
exercised before deployment, not after.

**Residual gap — closed 2026-10-25 (measurements in §6 item 9):** at an *unmatched* URL
only the catch-all applies, and it used to carry `script-src 'self' 'unsafe-inline'`, so
the 404 page's inline scripts were not hash-constrained. The catch-all now carries the
**union of every hash** in the build when that fits the 2,000-char line — and thanks to
`scripts/merge-inline-scripts.mjs` (which joins adjacent inline scripts before hashing)
**both platforms fit**: the deployed Linux build at 1,463 chars / 21 hashes and the
local Windows build at 1,409 chars / 20 hashes, so the local checker also passes with
**no flag**. The `unsafe-inline` fallback remains only as a guard against future
growth; `check-live-headers.mjs` **fails** on it unless `--allow-fallback` is passed
deliberately.

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
| Executable inline scripts found | **99** → **40 unique SHA-256 hashes** *(pre-merge inventory; after `merge-inline-scripts.mjs` was added the same day: **60** scripts → **20** unique hashes)* |
| Hashes per page (what a strict rule carries) | **4–9** → 567–842-char lines *(post-merge: 3 scripts per page, 518-char strict lines)* |
| `_headers` rules emitted / limit | **58 / 100** (1 catch-all + 57 strict) |
| Longest line / limit | **842 / 2,000 chars** *(post-merge: **1,436** / 2,000 — the catch-all union line; the pre-fix single policy was 2,516 — over)* |
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
| `node scripts/check-live-headers.mjs http://127.0.0.1:8124` | **OVERALL: PASS** — 6 routes all have every required header + the strict tier (4–40 `sha256-` hashes), the unmatched URL returns 404 with the 345-char catch-all tier, `/_headers` → 404. *Recorded as it was at the time; the run no longer needs `--allow-fallback` either —
since the inline-script merge step was added (§6 item 9, evidence below) local Windows
builds emit the strong catch-all again.* |
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

### 5.5 Live verification after the Cloudflare Pages cutover (2026-10-25)

The migration in §7 was performed: the site now deploys to **`https://irfanpdf.pages.dev`**
from `irfanpdf/irfanpdf.github.io` (project `irfanpdf`, production branch `main`, built by
Cloudflare from commit `c743f96`). Everything below was measured against the **production
URL**, not localhost.

| Check | Result |
|---|---|
| Cloudflare's own build log | `gen-headers: 58 rules (1 catch-all + 57 strict per-page) / limit 100; longest line 572 chars / limit 2000` — the two-tier file survived the host's limits on the host's own builder |
| Build environment | `NODE_VERSION=24` honoured (Cloudflare installed `node-v24.22.1-linux-x64`) |
| `node scripts/check-live-headers.mjs https://irfanpdf.pages.dev` | **OVERALL: PASS** — all required headers on 6 routes, strict tier (`sha256-`) on real routes, 345-char catch-all tier + 404 on an unmatched URL, `/_headers` → 404 not served |
| Response headers on `/` | `Server: cloudflare`, `CF-RAY` present; CSP (both tiers in one comma-joined value), `nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP, `X-Permitted-Cross-Domain-Policies`, HSTS `includeSubDomains` |
| Browser, 7 real routes | **0 CSP violations / 0 console errors**; unmatched URL shows only the expected 404 |
| Interactivity under the live policy | theme toggle (dark → light, `localStorage` updated), site assistant opens with its input, SPA navigation `/` → `/features/` — all working, 0 errors |
| `node crawl.js https://irfanpdf.pages.dev` | **OVERALL: PASS** |
| Env vars reached the build | canonical + `og:url` = `https://irfanpdf.pages.dev/`, sitemap 2,929 B with `pages.dev` locations, all three download links resolve to the `v1.7.0` release assets (no "not configured") |
| `irfanpdf.github.io` (the "run both" decision) | still **200 / `Server: GitHub.com`**, still header-less — old links keep working; only the new URL carries the policy |

**Update, later the same day (2026-10-25, after commit `3f204c5` deployed):** the
catch-all row above (345-char `unsafe-inline` tier) is now superseded — the catch-all
carries the **union of all hashes** instead (§6 item 9, closed). Re-measured live:
catch-all CSP **1,463 chars, 21 hashes, no `unsafe-inline` in `script-src`**,
`check-live-headers.mjs` → **OVERALL: PASS without `--allow-fallback`**, and the live
404 page's inline theme script demonstrably runs under that policy (theme toggle flips
the stored value). Actions run #10 (`3f204c5`) succeeded; the rows above are kept as the
record of the cutover-time state.

**One measured difference between the local and Cloudflare builds, explained rather than
glossed over:** locally `gen-headers` hashed **99 inline scripts → 40 unique hashes**
(longest line 842); Cloudflare's Linux build produced **80 → 21** (longest line 572). The
cause was found by diffing the actual HTML, not guessed: Windows `next build` emits the
RSC payload as several separate `self.__next_f.push(...)` inline scripts (6 local-only
scripts on `/features/`), while the Linux build emits the **same payload as one 100,575-char
script** (1 live-only script) — the payload starts with identical bytes
(`1:"$Sreact.fragment`, the same `/_next/static/chunks/0umf92h1sb77c.js` chunk names), so
it is the same content, chunked differently by platform. This is safe **by construction**:
`gen-headers` runs inside the same build that produced the HTML it hashes, so each side is
internally consistent — which is exactly what the 0-violation browser runs on both
localhost and `pages.dev` demonstrate. A cross-copying the local `_headers` onto the
Cloudflare build (or vice versa) would **not** be safe: the hashes would not match the
served HTML.

**Update, same day:** the inline-script merge step (`scripts/merge-inline-scripts.mjs`)
now runs on both platforms, and it removes the structural cause above — Windows's six
separate `self.__next_f.push(...)` scripts get joined into one run, exactly matching the
shape Linux already emitted. After merging, Windows yields 60 scripts / 20 hashes
(1,436-char longest line) against Linux's pre-merge 80 / 21 — the two builds are now the
same shape, though the rule in the previous paragraph still stands: never copy `_headers`
between builds, each is generated from its own bytes.

## 6. Limitations and residual risk (read before calling this "done")

1. **Two hosts serve two different realities (updated 2026-10-25).** The policy **is
   live** at `https://irfanpdf.pages.dev` (verified in §5.5). The legacy
   `https://irfanpdf.github.io` — kept running under the "run both" decision so old
   links never break — **still cannot send these headers** and serves visitors the header
   set in §1. Anyone on the old URL gets no CSP. The `<meta>` fallback was deliberately
   **not** added (decision recorded in §2). Retiring the old URL is an SEO/link decision,
   not a security one, and remains yours.
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
7. **`Access-Control-Allow-Origin: *`** was expected to disappear with the host change
   (it is GitHub Pages' default). Measured after the cutover: it is **still present on
   `irfanpdf.pages.dev`** too, and it does **not** come from our `_headers` (the file
   declares no `Access-Control-Allow-Origin`). So it is the new host's own default as
   well, and — like finding S2 — it is not configurable from this repository. Recorded
   as observed; the exact Cloudflare-side mechanism was not verified.
8. **Hosting caveat:** `_headers` is understood by **Cloudflare Pages and Netlify**.
   **Vercel does not read `_headers`** — a move there would need an equivalent
   `vercel.json`, which has not been written.
9. **The catch-all tier was deliberately weaker — CLOSED, live-verified 2026-10-25.**
   *As originally written:* Cloudflare caps `_headers`
   lines at 2,000 chars, so the strict hash list could not live on `/*`, and an
   unmatched URL received `script-src 'self' 'unsafe-inline'` — inline script on the
   404 page was **not** hash-checked. Two measurements changed the picture:
   **(a)** Cloudflare *merges* rules — a real page is served catch-all **and** its
   strict rule comma-joined (measured on `/features/`: two `default-src` directives,
   891 chars total) — so the catch-all cannot simply carry only the 404's hashes: it
   must permit *every* page's inline scripts too, or real pages break;
   **(b)** the 404 served at an unmatched URL is **our own** Next 404 page (4
   executable inline scripts), so its hashes are knowable at build time.
   The fix therefore puts the **union of all hashes** on `/*` (dropping
   `unsafe-inline`) — the same union the pre-two-tier single policy carried. Whether
   it fits is platform-dependent: the Linux build that deploys **fits**,
   Windows builds originally did **not** (40 hashes = 2,516-char line), so
   `gen-headers` automatically falls back to `unsafe-inline` there and prints a
   WARNING naming this residual as open *for that build*. `check-live-headers.mjs`
   now **fails** on a fallback catch-all unless `--allow-fallback` is passed, so a
   live regression to the weak mode cannot pass unnoticed.
   **Live evidence** (after `3f204c5` deployed, 2026-10-25, Actions run #10 success):

   | Check | Result |
   |---|---|
   | `check-live-headers.mjs https://irfanpdf.pages.dev` (no flag) | ✅ **strong**: catch-all CSP 1,463 chars, **21 hashes**, no `unsafe-inline` in `script-src` → **OVERALL: PASS**, exit 0 |
   | Same checker on the local Windows build | ✅ at the time: FAIL without flag / PASS with `--allow-fallback` — the fallback path was exercised and visible, as designed. **Since closed:** see the merge-step evidence below |
   | Live `crawl.js` | ✅ **OVERALL: PASS** |
   | Browser, live unmatched URL | ✅ 404 page renders, its inline theme script **runs** under the hash-constrained policy (toggle flipped the stored theme), only the expected 404 resource message; 0 CSP violations on `/`, `/features/`, `/download/` |

   **Checker bug found and fixed during this verification (honest record):** the first
   live runs reported `unexpected CSP shape (21 hashes)` — the predicate matched
   `unsafe-inline` anywhere in the policy, but `style-src-attr 'unsafe-inline'` is
   present *by design* (§5), so "strong" could never be true. The test is now scoped to
   the **`script-src` directive only** (and `script-src-attr`/`-elem` cannot masquerade
   as it), which is what surfaced the real strong-mode result above.
   **Remaining caveat — also closed 2026-10-25 (`scripts/merge-inline-scripts.mjs`,
   added to the build between `flatten-rsc` and `gen-headers`).** Windows local builds
   used to run the fallback (union 2,516 > 2,000) — a platform divergence, not a live
   gap. The new step joins each run of **adjacent inline scripts** (whitespace-only gap,
   same type, no attributes beyond `type`, execution order preserved) before `gen-headers`
   hashes them, taking the Windows export from 99 scripts / 40 hashes to **60 scripts /
   20 hashes**:

   | Local (Windows) check, after the merge step | Result |
   |---|---|
   | `npm run build` | ✅ exit 0 — `merge-inline-scripts: 99 → 60 (20 runs merged)`; `gen-headers: catch-all CSP = 1409 chars (strong: 20 hashes, no unsafe-inline)` — **no fallback, no warning** |
   | `check-live-headers.mjs http://127.0.0.1:8124` **without any flag** | ✅ `catch-all is hash-constrained (strong) — 20 hashes` → **OVERALL: PASS** |
   | `node crawl.js http://127.0.0.1:8124` | ✅ **OVERALL: PASS** |
   | `npm run typecheck` / `npm run test:assistant` | ✅ exit 0 / **206 passed, 0 failed** |
   | Browser, 9 routes (8 real + unmatched) | ✅ **0 CSP violations everywhere**; every `h1`/title correct, theme toggle → dark + `localStorage`, SPA nav → `/features/`, assistant replies, final console errors: none — i.e. the merged scripts behave **identically** to the unmerged ones |
   | `npm run build` / tests / audit after the `typescript@7` upgrade | ✅ same pass (the merge step is part of `build`) |

   The fallback path still exists as a guard against future growth and is still
   reachable on purpose with `--allow-fallback`; it simply no longer occurs in any
   normal build.

## 7. Moving to a host that can send these headers (the chosen path)

**PERFORMED 2026-10-25.** The site now deploys to **Cloudflare Pages (option A — no
custom domain)** at `https://irfanpdf.pages.dev`, and the policy is live and verified —
the evidence is in §5.5. The full runbook, including what was clicked in the dashboard,
the project settings, and the rollback, is in
[`CLOUDFLARE-PAGES-MIGRATION.md`](CLOUDFLARE-PAGES-MIGRATION.md). Summary:

1. **Done.** Project `irfanpdf` → `irfanpdf.pages.dev`, connected to
   `irfanpdf/irfanpdf.github.io` (production branch `main`), build command
   `npm run build`, output `out`, env vars `NODE_VERSION=24`,
   `NEXT_PUBLIC_SITE_URL=https://irfanpdf.pages.dev`,
   `NEXT_PUBLIC_DOWNLOAD_BASE_URL=…/v1.7.0` — set **before** the first deploy, as the
   runbook requires. Cloudflare's build log shows the generator's limits line, i.e. the
   two-tier `_headers` survived the host's own builder.
2. **Cloudflare Pages** reads `out/_headers` natively. The `_headers` file fits the
   host's documented limits (§4.1), so the policy that was verified locally is the
   policy visitors get — confirmed by measurement, not inference (§5.5).
3. **No custom domain is required for the headers** — this corrects an earlier version of
   this section, which said a domain was needed. That is only true for *proxying*
   `github.io` through Cloudflare (Transform Rules need a zone you own). On Pages,
   `_headers` works on the free `*.pages.dev` name. A domain remains optional — with the
   union-in-catch-all change (§6 item 9) the gap it used to close is closed in-repo
   instead, so a domain is now wanted only for its own sake (permanent name, meaningful
   `includeSubDomains`).
4. **GitHub Pages workflow** (`.github/workflows/deploy.yml`) stays untouched; under the
   "run both" decision it keeps serving the header-less version at the old URL, so old
   links never break (verified: `irfanpdf.github.io` → 200, `Server: GitHub.com`, no CSP).
   The SEO wrinkle this produced — **each host initially declared *itself* canonical** —
   was found by measurement and **fixed the same day**: the Actions `SITE_URL` variable
   now holds `https://irfanpdf.pages.dev`, run #6 was re-run after the change, and both
   hosts were verified serving canonical + `og:url` + sitemap pointing at `pages.dev`
   (evidence table in the migration doc §2.4). What remains yours is the larger call in
   §2.4 of that doc: whether `irfanpdf.github.io` should eventually retire entirely.
5. **Verification after cutover** (all run against the live URL, 2026-10-25 — §5.5):
   ```powershell
   node scripts/check-live-headers.mjs https://irfanpdf.pages.dev   # ended OVERALL: PASS
   node crawl.js https://irfanpdf.pages.dev                         # ended OVERALL: PASS
   ```
   plus a browser console read on 7 routes: 0 CSP violations, theme toggle, assistant and
   SPA navigation all working.

## 8. How to re-run this verification

```powershell
npm run build                       # flatten-rsc + merge-inline-scripts + gen-headers
                                    # (each step fails closed if it can't do its job)
node scripts/serve-headers.mjs      # serves out/ with the real headers on :8124
# then load http://127.0.0.1:8124/ in a browser and read the console:
#   0 "Content Security Policy" messages = policy and HTML still agree
node scripts/check-live-headers.mjs http://127.0.0.1:8124
#   ^ NO flag: since merge-inline-scripts joined adjacent inline scripts, both
#     platforms fit the catch-all union, so the local run must report STRONG and
#     end OVERALL: PASS — a fallback here would be a real regression
#   (--allow-fallback exists only to accept a fallback deliberately, e.g. while
#     debugging a build whose union outgrows the 2,000-char line again)

# against the production site (after any push that Cloudflare rebuilds):
#   NO flag here on purpose — a fallback catch-all on the live host is a FAIL:
node scripts/check-live-headers.mjs https://irfanpdf.pages.dev   # must end OVERALL: PASS
node crawl.js https://irfanpdf.pages.dev                         # must end OVERALL: PASS
```

If a future build legitimately introduces a new inline script, `gen-headers` picks it up
automatically — no manual hash maintenance. If it cannot, the build fails instead of
shipping a policy that would break the site.

> **Platform note:** the local (Windows) and Cloudflare (Linux) builds chunk the RSC
> payload differently, so their hash sets are **not** interchangeable (measured and
> explained in §5.5). Always verify against the host that will serve the bytes.

---

**Status:** source hardened · **policy LIVE at `https://irfanpdf.pages.dev`** (verified
2026-10-25, §5.5) · legacy `irfanpdf.github.io` still header-less by the "run both"
decision (§6.1) · no 100%-security claim implied (§6).
