# Full-site analysis — security, dependencies, content integrity, SEO, exposure

**Date:** 2026-10-25 · **Method:** read-only inspection of the repository and the live
deployment, plus live HTTP probes, a public-artifact download, and the already-built
site served locally. Nothing was deployed; nothing was pushed. Where a claim could not
be checked, it says so.

---

## 1. Verdict at a glance

| Area | Result |
|---|---|
| Secrets / credentials in repo or history | ✅ **none found** (only empty `.env.example`, and only that file was ever added) |
| Personal data in repo | ❌ **Windows username + local paths are public** — see finding **P1** |
| Dependency vulnerabilities (`npm audit`) | ✅ **0 vulnerabilities** (production *and* dev) — but 5 packages are behind, see **D1** |
| Live security headers | ❌ **still absent** (known; fix committed locally, needs the host move) — **S1** |
| Published download hashes vs real files | ✅ **3/3 match**; the publicly downloadable file hashes to the site's published value |
| Live download links | ✅ resolve **200** with exactly the published byte sizes |
| Tracking / cookies / third-party requests | ✅ **none** — no cookies on 3 probed routes, 0 external subresources, 0 mixed content |
| Source/config exposure on the host | ✅ `/.git`, `/package.json`, `/.env`, `/README.md`, `/docs/*` all **404** |
| SEO metadata | ✅ canonical, 9 Open Graph tags, `index,follow`, sitemap with 17 URLs, robots points at it |
| 404 behaviour | ✅ unknown route returns **404** |
| Responsible-disclosure channel | ❌ **none** (`/.well-known/security.txt` → 404) — **S3** |

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

**What this leaks:** the machine's user name (`<local-user>`) and the directory layout of the
private application source. Not credentials, not the application source itself (that
repository has **no remote at all** and is not public — verified below).

**Three remediation options, in increasing order of effort:**

1. **Fix forward** — reword the five lines to paths without the username. Fast, but the
   strings stay in the pushed history.
2. **Rewrite history + force-push** — `git filter-repo`/`filter-branch` over the pushed
   history, then `git push --force`. Removes it for real; rewrites all four commit hashes
   and requires a force push to a public repo (anyone who cloned keeps the old copy).
3. **Leave it** — accept the exposure as low-impact (user name only).

*Decision not taken — recorded here so it is not silently ignored.*

### S1 — MEDIUM (security headers): the live site still has no CSP / nosniff / clickjacking protection

Re-measured today on three routes (`/`, `/download/`, `/docs/`): `Content-Security-
Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` **all absent**; `Set-Cookie` absent; GitHub adds
`Strict-Transport-Security`; `Access-Control-Allow-Origin: *` is GitHub's default.

The complete, browser-verified replacement policy already exists in this repository
(commit `8f60490`, [`SECURITY-HARDENING.md`](SECURITY-HARDENING.md)). GitHub Pages
cannot send it — **the outstanding action is the host migration described in that
document §7.**

### S2 — LOW: `Access-Control-Allow-Origin: *` on every response

GitHub Pages serves the site's assets to any origin and this cannot be configured away
from the repository. It disappears with the host move.

### S3 — LOW: no responsible-disclosure contact

`/.well-known/security.txt` → 404, `/security.txt` → 404. The contact page itself states
no support channel exists (`docs/MISSING-ITEMS.md` item 4). A security researcher who
finds a problem on either public repo currently has no way to report it. Adding a
`security.txt` needs an address to point at — not available, so the gap is recorded
rather than filled with a placeholder.

### D1 — LOW (dependencies): 0 vulnerabilities, 5 packages behind

```
npm audit --omit=dev  →  found 0 vulnerabilities
npm audit             →  found 0 vulnerabilities
```

| Package | Installed | Latest | Kind |
|---|---|---|---|
| `next` | 16.4.2 | 16.4.3 | patch behind — framework (runtime) |
| `react` / `react-dom` | 19.2.0 | 19.3.1 | minor behind (runtime) |
| `typescript` | 5.9.3 | 7.0.2 | major behind (**dev only**) |
| `@types/node` | 24.19.2 | 26.6.5 | major behind (**dev only**) |
| `tailwindcss` | 4.3.3 | current | up to date |

CI installs with `npm ci`, so the lockfile is authoritative. Nothing here is urgent —
`npm audit` is clean — but `next 16.4.3` is a framework patch and the usual practice is
to take it. Not updated as part of an *analysis*; that is a change requiring its own
build + crawl verification.

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
| Version/date claims (`version: 1.7.0`, `releaseDate: 2026-10-11`) vs `docuforge\CHANGELOG.md` (`## 1.7.0 final build - 2026-10-11`) | ✅ match |
| Site claim "43 of 43 suites passing" vs the application's regression gate | ✅ consistent (all 43 suites pass locally) |

*Not verified:* the hashes of the two large public artifacts (110.6 MiB / 148.6 MiB) were
not re-computed from downloads — only their HTTP `Content-Length` matched. Re-hashing
~260 MB was not judged worth the time; a `Get-FileHash` on a downloaded copy settles it
if wanted.

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

- `<link rel="canonical" href="https://irfanpdf.github.io/">` ✅
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
| `irfanpdf/irfanpdf.github.io` | **public** | website source + docs (**exposes `<local-user>` paths — P1**) |
| `irfanpdf/irfanpdf-releases` | **public** | the three v1.7.0 installers |
| `docuforge` (application source) | **no remote configured** — not published anywhere | source, security docs, dist |

`npm audit` clean · 0 cookies · 0 third-party requests · 0 secrets · hashes verified end
to end from the public download back to the local artifact.

---

## 7. Open actions (none performed here)

1. **P1** — decide: fix-forward the five path lines, rewrite history + force-push, or
   accept.
2. **S1** — migrate hosting so the committed `_headers` policy takes effect
   (`SECURITY-HARDENING.md` §7).
3. **S3** — add `security.txt` once a contact address exists.
4. **D1** — consider `next@16.4.3` (framework patch) with a rebuild + `crawl.js` run;
   dev-only majors (`typescript@7`, `@types/node@26`) are optional and disruptive.
5. Re-hash the two large public artifacts if byte-level confirmation of all three is
   wanted (§3.1).
