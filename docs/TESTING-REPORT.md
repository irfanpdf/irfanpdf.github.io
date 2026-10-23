# TESTING REPORT — Irfan PDF official website

**Subject:** `irfan-pdf-website` (Next.js 16.4.2 static export) and the Irfan PDF 1.7.0 desktop application
**Website tests executed:** 2026-10-16 → 2026-10-17, final pass 2026-10-22; site assistant added and tested 2026-10-23 (local machine, static export served over HTTP)
**Application verification executed:** 2026-10-16
**Product verification date used everywhere on the site:** 2026-10-16
**Method:** every row below was executed and observed; the evidence column names the tool and the observed
number. Nothing is marked PASS on the basis of source reading alone.

---

## 1. Website test environment

| Item | Value |
| --- | --- |
| Build output | `out/` (`output: "export"`, static HTML) |
| Static server | `node test-server.js` → `http://127.0.0.1:8123` (zero-dependency, directory-index resolution, custom 404) |
| Crawler | `node crawl.js` (route + internal link + asset checker, `crawl.js` in repo root) |
| Browser | Chromium via the agent browser harness, viewport 800×766 (see limitation L-1) |
| Colour schemes | forced light **and** dark via `localStorage.ipdf-site-theme`; every audit run twice |
| Audit tool | Lighthouse (accessibility, SEO, best practices) |
| Trace tool | Chromium performance trace + `performance` API timings |

---

## 2. Build and type safety

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| B1 | `npx tsc --noEmit` | **PASS** | exit 0, zero diagnostics (run after every change set) |
| B2 | `npm run build` (static export) | **PASS** | 21 static routes generated: `/`, `/features`, `/how-it-works`, `/use-cases`, `/compare`, `/security`, `/download`, `/docs`, 9 docs pages, `/robots.txt`, `/sitemap.xml`, `/_not-found` |
| B3 | RSC payload adapter runs at end of build | **PASS** | `flatten-rsc: copied 17 RSC payload file(s) to flat dot-form names` |
| B4 | Unconfigured build ships no guessed URLs | **PASS** | with no env vars: `canonical` absent, `og:url` absent, `robots.txt` has no `Sitemap:` line, `sitemap.xml` contains 0 `<loc>` |
| B5 | Configured build populates URLs | **PASS** | with `NEXT_PUBLIC_SITE_URL=https://www.irfanpdf.example` (RFC 2606 reserved test value, never deployed): canonical on **17/17** pages matches its own path, `og:url` on home, `Sitemap:` line in `robots.txt`, **17** `<loc>` entries. **Re-run 2026-10-22 on the final build, also with `NEXT_PUBLIC_DOWNLOAD_BASE_URL=https://downloads.example.com/irfan-pdf`** (example.com is likewise RFC 2606-reserved): canonicals 17/17 with 0 strays, sitemap 17 `<loc>`, `Sitemap:` line present, and the Download Center links **exactly 3** hrefs — `<base>/IrfanPDF_Setup_1.7.0.exe`, `<base>/IRFAN-PDF-PROFESSIONAL.zip`, `<base>/IrfanPDF_Portable.zip` — with 0 links outside the test base. The output was then rebuilt **without** either variable (B4 re-confirmed) as the shipped artifact |

> The shipped `out/` folder is the **unconfigured** build (B4). The real domain and the real download host
> are unknown, so the final artifact deliberately contains no URLs that were not verified.

---

## 3. Routing, links and assets (crawl of `out/`)

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| R1 | All expected routes return 200 | **PASS** | 20/20: 17 content routes + `/robots.txt` + `/sitemap.xml` + `/404` |
| R2 | Internal link crawl | **PASS** | 36 page URLs discovered, **0 broken internal links** |
| R3 | Local asset crawl (`/_next/**`, `/screenshots/*`, `/favicon.ico`) | **PASS** | **313/313** assets returned 200 |
| R4 | Unknown URL serves custom 404 with status 404 | **PASS** | `/definitely-missing-page` → HTTP 404, `404.html` body |
| R5 | 404 page is not indexable | **PASS** | `noindex` appears only in `404.html`, `404/index.html`, `_not-found/index.html` |
| R6 | External links | **PASS (listed, not fetched)** | 10 unique URLs, all on official vendor domains: adobe.com (4), foxit.com (1), pdf-xchange.com (2), tools.pdf24.org (3) |

---

## 4. Interaction testing (real clicks, real state changes)

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| I1 | Header/footer navigation | **PASS** | clicking "Features" navigated to `/features/`, title `Features · Irfan PDF`, h1 `Only what the build can actually do`, client-side navigation (no new `performance` navigation entry) |
| I2 | Compare table — group filter | **PASS** | 17 rows → "Pricing" = **2 of 17**; "All rows" restores 17/17 |
| I3 | Compare table — "only rows where products differ" | **PASS** | 17 rows → **7 of 17**; combined with Pricing = 2 |
| I4 | Compare table — live region | **PASS** | `aria-live` paragraph re-reads "Showing N of 17 rows · verification date 2026-10-16" after each filter change |
| I5 | Theme toggle | **PASS** | dark → light → dark: `html.dark` class, `aria-label` (🌙 "Switch to dark theme" ↔ ☀️ "Switch to light theme") and icon all switch; preference persisted |
| I6 | Download page — unconfigured state | **PASS** | 3 packages with version, release date, size, type, Windows support, signature status and SHA-256; each shows "Download link not configured yet" plus the exact missing requirement (`NEXT_PUBLIC_DOWNLOAD_BASE_URL`) |
| I7 | Copy SHA-256 button | **PASS** | clipboard write is **blocked in this test environment**; the button now announces the failure through its label and `aria-live` instead of failing silently (bug F-6 fixed during testing) |
| I8 | Mobile menu at 375×667 | **PASS** | hamburger visible, desktop nav hidden, click → `aria-expanded="true"` + label "Close menu", 9 menu links visible, activating "Features" navigated the viewport to `/features/` with the correct h1, menu closed |

---

## 5. Accessibility (Lighthouse, axe) — 34 audits

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| A1 | Home page — accessibility / SEO / best practices | **PASS** | 1.00 / 1.00 / 1.00 |
| A2 | All 17 content pages, accessibility, **light** scheme | **PASS** | **17/17 = 1.00** |
| A3 | All 17 content pages, accessibility, **dark** scheme | **PASS** | **17/17 = 1.00** |
| A4 | **Final re-run 2026-10-22** on the five pages whose content changed last (`/`, `/download/`, `/features/`, `/docs/release-notes/`, `/docs/installation/`) — Lighthouse 13.5.0, light | **PASS** | **5/5 = 1.00 / 1.00 / 1.00**, zero scoring audits at 0 |
| A5 | Same five pages, **dark** scheme, axe-core 4.10.3 (full ruleset, injected into the running page) | **PASS** | **0 violations on 5/5 pages** |

Bugs found by these audits and fixed during testing (all in this session, before the final build):

| ID | Finding | Fix |
| --- | --- | --- |
| F-1 | Section heading inside the always-dark "Latest release" band rendered `text-zinc-950` on `bg-zinc-950` in **light** mode — heading invisible (measured: computed colour identical to background) | `Section` gained `tone="dark"`; the band passes it |
| F-2 | Hero `<dl>` contained `<div><div>` instead of `dt`/`dd` (axe `definition-list`) | `Stat` now emits `dt` (value) + `dd` (label) |
| F-3 | Muted text used `text-zinc-500` (4.36:1 on white) on `/compare` and `/download` | project-wide `text-zinc-500` → `text-zinc-600` (7.0:1) in 9 files |
| F-4 | Muted text inside always-dark cards (`#141722`, `#11131c`) lacked a dark-scheme override (3.67–3.9:1) | added `dark:text-zinc-400` at 6 call sites |
| F-5 | Heading order skipped a level on `/compare`, `/download` and `/docs/faq` (`h1` → `h3`) | top-level headings promoted to `h2` (12 in FAQ, 2 in compare table, 1 in download cards) |

Manual/structural checks: skip-to-content link present, one `h1` per page, landmarks (`banner`/`main`/`contentinfo`),
mobile menu is a real `button` with `aria-expanded`, filter result count is `aria-live`, copy feedback is `aria-live`,
all copy buttons carry descriptive `aria-label`s, `<table>` has a `<caption>`, all images have `alt` text.

---

## 6. Performance (measured, not estimated)

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| P1 | Home load timings (localhost) | **PASS** | TTFB 300 ms, DOMContentLoaded 709 ms, load 3588 ms, 8 requests, 645 KB transferred (454 KB script, 191 KB link/preload) |
| P2 | Docs page load timings | **PASS** | `/docs/faq`: TTFB 132 ms, DCL 413 ms, load 1131 ms, 7 requests, 504 KB |
| P3 | Render trace, home | **OBSERVED** | 1,565 events; 6 tasks > 50 ms (largest 733 ms, hydration); Layout 32 ms; 2 layout-shift-free paints measured; tool explicitly does **not** compute LCP/INP/CLS |
| P4 | Static payload | **PASS** | 149 files / 4.7 MB total; JS 13 files 618 KB; CSS 1 file 44 KB; images 6 files 448 KB; largest HTML `/features` 164.6 KB **uncompressed** (test server does not gzip; a real host will) |
| P5 | Core Web Vitals (LCP/INP/CLS) | **NOT VERIFIED** | the trace tool used here refuses to compute them and no field data exists for an undeployed site — deliberately left unclaimed |

---

## 7. Console output

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| C1 | Console on every interaction | **PASS** | 0 errors, 0 warnings on home, features, compare (both filter states), download, 375 px mobile menu run, after fix F-7 |
| C2 | Pre-existing warning on home | **ACCEPTED (documented)** | one `link preload ... not used` warning for `/screenshots/home.png`, injected by Next's automatic eager-image preload; the image is the hero and loads correctly (HTTP 200) |

---

## 8. Bugs found and fixed during website testing

| ID | Severity | Finding | Root cause | Fix |
| --- | --- | --- | --- | --- |
| F-7 | High | Every `<Link>` prefetch returned 404 in the console (`/__next.download.__PAGE__.txt`) | **Known upstream bug**: vercel/next.js#85374 — on Windows, `output: "export"` writes segment payloads as nested folders (`__next.download/__PAGE__.txt`) because `path.relative()` yields backslashes, while the client requests the flat dot-form name. Linux/macOS builds are unaffected. Fix PR vercel/next.js#99058 is still open (checked 2026-10-16) | `scripts/flatten-rsc.mjs`, run automatically by `npm run build`, copies each payload to its flat name (17 files). Site now navigates client-side with a clean console |
| F-8 | High | `canonical` was declared as a root metadata key, so **no page ever emitted a canonical tag** | Next expects `alternates.canonical`; unknown root keys are silently dropped | new `canonicalFor(path)` helper in `src/data/env.ts`; 17 pages declare their own canonical (proved by B5: 17/17) |
| F-9 | High | An unconfigured build shipped `noindex, follow` on every page — hosting `out/` as-is would make the whole site invisible to search engines | deliberate safety added earlier, but it defeats the SEO requirement | root metadata is now always `index: true, follow: true`; URLs are still omitted rather than guessed |
| F-6 | Medium | Copy-checksum button failed silently when the clipboard was blocked | `catch {}` with no user feedback | three-state button: copied / failed, both announced via label and `aria-live` |

---

## 9. Application verification (Irfan PDF 1.7.0, real installer)

All steps ran against a **throwaway install directory** (`%LOCALAPPDATA%\Temp\opencode\ipdf_install_test`) with
`/TASKS=` so no shortcuts were created and no `.pdf` association was changed. The live installation in
`C:\Program Files\Irfan PDF` and the running application were never touched.

| # | Test | Result | Evidence |
| --- | --- | --- | --- |
| V1 | Silent install (`/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /DIR=…`) | **PASS** | exit code 0; `runtime` 4,597 files, `server`, `tests`, `data`, `web`, `tools`, `wheelhouse`, launcher `.exe/.bat`, `unins000.exe` all present |
| V2 | First-run health self-test on the installed copy | **PASS** | **PASS 20 / FAIL 0 / SKIP 0** (53 s), run with the bundled `runtime\python.exe`; report written to `IrfanPDF_Health_Report.html` and `data\logs\health-*.json` |
| V3 | Real document through the live API | **PASS** | upload OK; page render `200` (63,625 B PNG); OCR job `done` → `sample_shot (searchable).pdf`; download `200` (3,516 B); original file intact (3,559 B) |
| V4 | Upgrade path (same installer, same directory) | **PASS** | exit code 0; health self-test re-run after upgrade: **PASS 20 / FAIL 0 / SKIP 0** (40.4 s) |
| V5 | Uninstall (`unins000.exe /VERYSILENT /SUPPRESSMSGBOXES /NORESTART`) | **PASS** | exit code 0; uninstaller deleted itself and all installed files |
| V6 | Uninstall residue | **PASS** | only runtime-generated artefacts remain: 402 + 16 `.pyc` files under `runtime`/`server`, plus `data` cache/logs/converted files created by the tests above. **Zero installed application files left behind** |
| V7 | Registry untouched | **PASS** | during the whole test only `HKCU\Software\Irfan PDF\InstallPath` changed (installer line 148); `HKCU\Software\Classes\IrfanPDF.Document` never created; `.pdf\OpenWithProgids` contains no values |
| V8 | Registry restored afterwards | **PASS** | `InstallPath` restored to `C:\Program Files\Irfan PDF` and re-verified against the pre-test snapshot `installer_snapshot.json` (key present, no Irfan values, `IrfanPDF.Document` absent) |

### Not verified in the application (stated, not hidden)

| ID | Item | Why |
| --- | --- | --- |
| N-1 | Clean-VM install on fresh Windows 10 1809 and Windows 11 | no virtual machine available on this machine; the install was verified on this Windows host only |
| N-2 | Code signing / SmartScreen behaviour | the packages are **NotSigned** (Authenticode status verified), so unsigned-warning behaviour cannot be described as tested |
| N-3 | OCR in languages other than English | the bundled model is English PP-OCRv5; the site says exactly that |
| N-4 | Refusal paths for digitally signed and encrypted PDFs in this session | covered by the shipped regression gate, not re-executed during website work; the docs pages cite the gate rather than a fresh run |
| N-5 | Upgrade from every earlier release (1.0.0 … 1.6.x) | only a same-version re-install (V4) was executed; older-version upgrades are unverified |
| N-6 | Print pipeline (page ranges, N-up, hand-over to printer) | no printer/print driver exercised in this environment |

---

## 10. Regression gate — the application's own test suite

Run twice on **2026-10-17** with system Python 3.12.10 (`py -3.12 tests\run_regression.py`), the runner starting the
application itself on 127.0.0.1:8765. Both logs are kept in `docs/evidence/` (≈207 KB each):

| Run | Result | Suites | Evidence |
| --- | --- | --- | --- |
| 1 — before the fix | **FAIL** | 42 of 43 | `regression-gate-2026-10-17-before-fix.txt` |
| 2 — after the fix | **PASS** | **43 of 43, 0 failures** | `regression-gate-2026-10-17-after-fix.txt` |

Passing suites in run 2 include `test_e2e` 37/37, `test_document_integrity` 52/52, `test_security_pages` 73/73,
`test_print` 78/78, `test_print_api` 63/63, `test_package` 52/52, `test_analyst` 36/36, `test_analyst_exports` 44/44,
`test_analyst_api` 40/40, `_test_font_preserve` 24/24, `_test_deskew` 16/16, `test_bundled_runtime` 23/23 and
`test_batch_compare` **46/46**.

### What run 1 found, and what was done about it

| Check (all three in `test_batch_compare`) | Run 1 |
| --- | --- |
| cancelling twice is accepted while it runs | FAIL — first cancel `ok: true`, second `{"ok": false, "message": "The job has already finished"}` |
| a stopped OCR job ends as cancelled | FAIL — the job ended `done` at 100% |
| a stopped OCR job produced no result file | FAIL — a result file was written |

**Investigation.** Reproduced both inside the full gate (busy machine) and by running that suite alone against a
freshly started app (idle machine) — identical 43/46 both times. Reading both sides of the contract showed the real
defect: `h_ocr_pdf` never passed a stop hook into `scanned_pdf_to_editable()`, so a single-document OCR acknowledged a
stop and then ran to completion anyway. A second, older defect surfaced in the same area: the PDF AI Analyst handler
passed the `Job.cancelled` **property** where `ocr_bridge` polls a **callable** (`callable(should_cancel) and
should_cancel()`), so a long analysis could never be stopped either. The 2026-10-14 log shows this suite at 46/46
("cancelled after 99%") on the same machine — which is why it looked like a timing flake, and why it was not treated
as one: a stop the application acknowledges and then ignores is a defect whatever the machine speed.

**Fixes applied to the application source (2026-10-17), 3 files:**

| File | Change |
| --- | --- |
| `server/core/ocr/text_layer.py` | `scanned_pdf_to_editable(..., should_cancel=...)` polls the flag at every page boundary and raises `JobCancelled` |
| `server/api/jobs.py` | `h_ocr_pdf` passes a callable `lambda: job.cancelled` and deletes the partial output before re-raising; the analyst handler passes a callable too |
| `tests/_test_batch_compare.py` | cancel fixture changed from a 4-page to a 12-page OCR so the scenario is genuinely exercised — **assertions unchanged** |

**Verification of the fix:** `test_batch_compare` 46/46 in isolation; a purpose-built check against a live app
(12-page OCR, cancel at **95% progress**) ended `cancelled` with **no result file**; then the full gate again: **43/43,
0 failures** (run 3 — after a second, related defect was found and fixed: a Stop issued *after* the last page still
let the result file be written, so a pre-save check was added; `test_batch_compare` re-verified at 46/46 and the
third gate run passed the same 43/43). Recorded in the project's `CHANGELOG.md` as *Unreleased · 2026-10-17*.

**The fix is in the shipped files (2026-10-22):** all three packages were rebuilt with the fixed source and each
was verified by running it — the installer installed silently into a clean folder and self-tested **PASS 20 / FAIL 0**,
a Stop on a 12-page scan against that installed copy ended `cancelled` at 5% with no output file, and the same test
was repeated on the extracted Professional ZIP (also `cancelled` at 5%, no output); the source ZIP self-tested
PASS 20 / FAIL 0 too. (An earlier verification pass on 2026-10-17 measured the same behaviour at 12% and 95%.)
New hashes and sizes for all three are in the Verification Report §4 and on the Download Center.

**Consequence for this site:** the gate badge, home stat, comparison `[P0]` label, footer and docs pages read
**"43 / 43 suites PASS, run 2026-10-17"**, and the release notes tell the found → fixed → re-run story instead of
showing a bare pass. The Download Center and the Features page now state that the between-pages Stop behaviour is
in the published packages, with the measurements above.

### Pre-existing shipped report (unchanged artifact)

| Source | Result | Date |
| --- | --- | --- |
| Shipped `TEST-REPORT.md` inside the package | **40 suites / 1,093 declared checks, 40 of 40 passing** | 2026-10-05 |

Both this run and the shipped report are quoted on the website exactly as recorded, with their dates.

---

## 11. Limitations of this test session

| ID | Limitation | Effect |
| --- | --- | --- |
| L-1 | The browser viewport is fixed at 800×766 and the harness offers no resize or device emulation | layout **above 1024 px** (`lg:` header with inline navigation) was **not visually verified**. 375 px mobile and 800 px were verified (I8, and the 800 px runs). Layout uses standard Tailwind breakpoints; this is the one honest gap in the UI testing |
| L-2 | Lighthouse here scores accessibility/SEO/best practices only | no Lighthouse performance score; CWV are marked NOT VERIFIED (P5) |
| L-3 | Local static server does not compress responses | all payload figures are uncompressed; real-host numbers will be lower |
| L-4 | Clipboard writes are blocked in the automation environment | only the "copy blocked" path of I7 could be executed; the "copied" path was not observed on a real browser |
| L-5 | External vendor URLs were listed, not requested | their current content was verified on 2026-10-16 when the comparison data was compiled (see `docs/VERIFICATION-REPORT.md`) |

---

## 12. Summary

| Area | Tests | Passed | Failed | Not verified |
| --- | --- | --- | --- | --- |
| Build / type safety | 5 | 5 | 0 | 0 |
| Routing / links / assets | 6 | 6 | 0 | 0 |
| Interaction | 8 | 8 | 0 | 0 |
| Accessibility (audits) | 3 (+5 findings fixed) | 3 | 0 | 0 |
| Performance | 4 | 3 | 0 | 1 (CWV) |
| Console | 2 | 2 | 0 | 0 |
| Application verification | 8 | 8 | 0 | 0 |
| Regression gate (43 suites, run twice 2026-10-17) | 43 | **43** | 0 — run 1 failed 1 suite (`test_batch_compare` 43/46), the cause was fixed in the app source, run 2 passed 43/43 (§10) |
| Application items not verifiable here | 6 | — | — | 6 |

**Website result: PASS** (36 executed checks, 0 failures, 1 documented not-verified metric).
**Application result: PASS** for the install / upgrade / uninstall verification and the live API work on this
machine. The application's own regression gate **found a real defect on 2026-10-17** — a stop request on a single-document
OCR was acknowledged and then ignored — the cause was fixed in the app source (3 files), and the re-run passed
**43 of 43 suites, 0 failures** (§10). 6 further items are explicitly not verified and are marked as such on the site rather than claimed.

---

## 13. Integrity pass - 2026-10-17 (after the content corrections); packages re-measured 2026-10-22

Executed after the corrections listed in `docs/VERIFICATION-REPORT.md` (§ re-verification pass).

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| D1 | SHA-256 + byte sizes of all three packages | **PASS** | recomputed with `Get-FileHash -Algorithm SHA256` after the final 2026-10-22 rebuild (editor font-inheritance fix); identical to the values now published on the Download Center |
| D2 | Professional ZIP contents | **CORRECTED** | measured 4,452 files / 4,195 runtime / 166 tests / 365.6 MiB in the rebuilt archive — the site previously said 4,494 and 4,230, now fixed in three places |
| D3 | Windows requirement provenance | **CORRECTED** | `irfan_pdf.iss` declares no `MinVersion`; the requirement is the shipped guide's wording — now stated as such |
| D4 | Compare field count | **CORRECTED** | hero said "Fourteen fields" for a 17-row table; now derived from `ROWS.length` |
| D5 | Regression gate: found a defect, fixed it, re-ran | **43 of 43 suites, 0 failures** | run 1 = 42/43 (evidence `…-before-fix.txt`), fix in app source, run 2 = 43/43 (evidence `…-after-fix.txt`), run 3 after the final packaging fix = 43/43 (evidence `…-run3.txt`); analysed in §10, site updated everywhere |
| D6 | In-page anchor links | **PASS** | footer → `/docs/release-notes/#gate`, docs index → same, privacy → `/docs/installation/#updating`: each lands with the target heading at the top (smooth scroll settles within ~1.5 s). A first measurement appeared to fail because it raced that animation; `HashScroller` was added so fragment scrolling does not depend on router behaviour |
| D7 | Lighthouse accessibility after all content changes | **PASS** | **34/34 audits = 1.00** (17 pages × light and dark); re-run 2026-10-22 on the five content-changed pages = 1.00/1.00/1.00 each, dark axe-core pass 0 violations (rows A4/A5) |
| D8 | Crawl after all content changes | **PASS** | 20/20 routes 200, 0 broken internal links, 313/313 assets, 149 files in `out/` |
| D9 | Console | **PASS** | 0 errors / 0 warnings on home, compare, download, release notes, all anchor navigations |
| D10 | Encoding integrity | **PASS** | 0 replacement characters in all `docs/*.md` and `src/**` files after the corrections were written |

**Integrity pass result: PASS** — 10 checks, 0 failures, 3 content corrections applied and verified on the rendered pages.

---

## 14. Site assistant (floating chat widget) — added and tested 2026-10-23

The site gained a floating assistant (bottom-right) that answers questions about Irfan PDF from the site's own
documentation. It is a client-side keyword/retrieval matcher (`src/lib/assistant.ts`), **not** a language model —
the widget says so when asked — with no API key, no backend and no network calls of any kind.

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| A1 | Unit tests: question→answer routing, honest fallback, chip routing, reply hygiene, link validity, unique ids | **PASS** | `npm run test:assistant` (scripts/test-assistant.mjs) = **206 checks, 0 failures**; the first run found **3 real routing bugs** (SmartScreen→download, "make a docx"→features, "are you a real ai"→fallback), fixed in `src/lib/assistant.ts` before the 206/0 re-run. Every entry link is asserted to be one of the site's 17 served routes |
| A2 | Type safety | **PASS** | `npx tsc --noEmit` exit 0 after the change set |
| A3 | Static export | **PASS** | `npm run build` exit 0; toggle button present in `out/index.html` (`aria-controls="site-assistant-panel"`); the dialog itself is **not** pre-rendered — it mounts only when opened |
| A4 | Engine actually shipped in the JS | **PASS** | shipped chunks contain the intro, the disclaimer, the fallback text and knowledge strings (e.g. "English PP-OCRv5 model") |
| A5 | No new external resources | **PASS** | 0 added external `src`/`href` in the built home page; `out/` = 4.83 MB |
| A6 | Crawl after adding the widget | **PASS** | local `node crawl.js` → OVERALL PASS (routes, 0 broken internal links, 313/313 assets, 6/6 content checks) |
| A7 | Browser: open/close + a11y basics | **PASS** | toggle `aria-expanded` flips; panel is `role="dialog"` with label; Escape closes it; focus returns to the toggle button |
| A8 | Browser: typed question → grounded answer | **PASS** | "does it work offline" → correct offline answer + FAQ link; input cleared after send; send disabled while the input is empty |
| A9 | Browser: honest fallback | **PASS** | "what is the capital of france" → "I don't have an answer for that…" + Documentation-home link; suggestion chips reappear after a fallback |
| A10 | Browser: suggestion chip click | **PASS** | "Is it free?" chip → correct free/pricing answer + Terms-of-use link; chips hide after the first question |
| A11 | Browser: reply link + SPA persistence | **PASS** | clicking a reply link closes the panel and navigates (observed landing on `/docs/installation/`); the widget persists across client-side navigation (it lives in the root layout) |
| A12 | Dark theme | **PASS** | forced dark: panel `rgb(20,23,34)`, header `rgb(204,0,0)`, bot bubbles `rgb(28,31,43)`, input/disclaimer `rgb(16,19,32)`, near-white text — measured with computed styles, matches the authored dark tokens |
| A13 | CI unaffected | **PASS** | the deploy workflow runs only `npm ci` + `npm run build` (the never-functional `next lint` script, removed in Next 16, was deleted from `package.json`) |
| L1 | Not tested | — | full keyboard-only traversal of the panel and screen-reader announcements were **not** audited; the Lighthouse/axe runs in §5 predate the widget (it opens client-side, so static audits don't see it). Escape handling and focus return are verified (A7); a full a11y pass on the open widget remains open work |

**Site assistant result: PASS** — 14 executed checks (206 unit checks), 0 failures, 1 documented limitation (L1).
