# Risk report

**Date:** 2026-10-16 · Risks of publishing this website, ordered by severity.
Each row: risk → likelihood/impact → mitigation already applied → remaining action.

| # | Risk | L / I | Mitigation in place | Owner action |
|---|---|---|---|---|
| R1 | **Claims drift from the product** (site advertises something the app cannot do, or a future build regresses) | M / H | All content lives in `src/data/*` keyed to `docs/VERIFICATION-REPORT.md`; gate numbers dated; “Not Verified” used wherever evidence was missing | Re-run the verification report + gate after every release; update `screenshots/` when the UI changes |
| R2 | **Download links point to nothing (or the wrong thing)** at launch | H / M | No invented URLs; unconfigured state is explicit; SHA-256 published so users can verify what they get | Set `NEXT_PUBLIC_DOWNLOAD_BASE_URL` only when files are actually served; verify hashes after upload |
| R3 | **Publishing the broken `IrfanPDF_Portable.zip`** (README claimed a runtime it did not contain) | M / H | **Mitigated 2026-10-22:** the archive was rebuilt with its launcher and a truthful source-only README, extracted and self-tested (PASS 20 / FAIL 0), and the Download Center describes it as it really is | Keep the description in step with the builder if `build\build_portable.ps1` changes again |
| R4 | **Unsigned installer → SmartScreen warnings / user distrust** | H / M | Website states the signature status openly (`NotSigned`) and tells users how to verify SHA-256 | Acquire a code-signing certificate (roadmap item) |
| R5 | **Competitor prices/claims go stale** (vendor pages change) | H / L | Every competitor cell carries a source id + fetched date (`2026-10-16`); a disclaimer says to re-check official pages | Quarterly re-fetch of `SOURCES`; update `src/data/comparison.ts` |
| R6 | **Privacy mismatch between statement and reality** | L / H | Application privacy statements are code-derived (no HTTP client, loopback-only, no telemetry — grep evidence, 2026-10-16); website sets no cookies/analytics | Re-run the privacy grep on every release; re-check before changing hosting (host access logs are the host's policy) |
| R7 | **SEO signals incomplete until a domain exists** (no canonical, empty sitemap) | H / L | Site builds cleanly without URLs and stays indexable — unverified URLs are omitted rather than guessed; only the 404 page carries `noindex` | Provide `NEXT_PUBLIC_SITE_URL`, rebuild → canonical (17 pages), sitemap and OG URLs appear automatically |
| R8 | **Screenshot shows user data** | L / H | Shots taken on a clean temporary profile with a self-generated neutral sample; temp folder and instance deleted afterwards; no username/paths visible | Repeat the clean-profile procedure for any future capture (procedure in ASSET-INVENTORY §2) |
| R9 | **Legal: using competitor names** | L / M | Comparison page states no affiliation; names used only for identification; sources cited; no superiority claims without evidence | Keep disclaimers if the table grows |
| R10 | **Accessibility gaps lock out users** | L / L | Lighthouse accessibility **1.00 on all 17 pages in both light and dark** (34 audits, 2026-10-17); five findings found and fixed during testing (heading invisible on a dark band in light mode, invalid `<dl>`, three contrast/heading-order classes) — TESTING-REPORT §5 | Re-run the audits after any content or styling change |
| R11 | **Static export breaks if a route becomes dynamic** | L / M | `output: "export"`, `force-static` on route data files, no server actions/APIs in the site | Keep `npm run build` green in CI once CI exists (roadmap) |
| R12 | **Large download files on the web host** | M / L | Buttons only activate when a base URL is configured; sizes published (8 MB / 111 MB / 149 MB) so hosting limits are known upfront | Confirm host file-size/bandwidth limits before enabling links |
| R13 | **Upstream Next.js 16 defect breaks RSC prefetch on Windows builds** (vercel/next.js#85374) | H on Windows / L | `scripts/flatten-rsc.mjs` runs at the end of every build and rewrites the 17 payload files to the names the browser requests; verified clean console + working client-side navigation (TESTING-REPORT F-7) | Keep the adapter until vercel/next.js#99058 ships, then remove it and re-run `node crawl.js` |

## Residual honesty note

The two highest-impact risks (R1 claim drift, R3 broken portable ZIP) are *content*
risks, not technical ones: the site's architecture cannot introduce them — only a
future edit without re-verification can. The verification report is the gate.
