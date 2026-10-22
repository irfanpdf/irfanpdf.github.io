# Missing items report

**Date:** 2026-10-16 · Items the website needs (or the reader expects) that **could
not be found in the project files**. Each entry states the exact gap and what was
done instead — nothing here was guessed or filled in with a placeholder.

| # | Missing item | Impact | What the site does instead |
|---|---|---|---|
| 1 | **Public domain / canonical URL** | No canonical, Open Graph URL or sitemap entries until a domain exists | `NEXT_PUBLIC_SITE_URL` unset → URLs omitted (pages stay indexable; only the 404 is `noindex`); documented in README + `.env.example` |
| 2 | **Public download URLs** for the 3 packages | Download buttons cannot point anywhere real | Buttons render verified metadata (name/version/size/SHA-256/signature) plus a “Download link not configured yet” state naming the exact missing requirement (`NEXT_PUBLIC_DOWNLOAD_BASE_URL`). No placeholder links anywhere |
| 3 | **Screenshots** in the repository | “Verified screenshots” requirement could not be met from repo assets alone | Five real captures taken from the running application (clean profile, neutral sample file) on 2026-10-16 — see `ASSET-INVENTORY.md` §2 |
| 4 | **Contact / support channel** (email, forum, issue tracker) | Contact page cannot publish a channel | `/docs/contact/` states this explicitly (“Cannot verify from project files”) and lists exactly what a request must include (health report, `data\logs`, repro steps) |
| 5 | **License text** (`LICENSE` absent) | Terms page cannot state licensing terms | `/docs/terms/` says licensing cannot be verified from project files; quotes only README §9 (“Original code and design built for this project”) |
| 6 | **Release date of 1.0.0** | Version history has a hole | Release notes label 1.0.0 “earlier (no date recorded)” exactly as the CHANGELOG does |
| 7 | **Code-signing certificate** | SmartScreen warnings on download; signature status is a negative fact | Publishes measured `Authenticode: NotSigned` for the EXE and marks signing as a *Planned* roadmap item |
| 8 | **CI/CD** (no `.github\`, no workflows) | No automated build/test pipeline to link or badge | Site cites manual regression runs (2026-10-17: 42/43 PASS) with dates instead |
| 9 | **`IrfanPDF_Portable.zip` integrity** — **RESOLVED 2026-10-22** | Archive contradicted its own README: README said “Python is already inside”, the ZIP contained **0 runtime files** and **no root `start_portable.bat`** (132 entries verified) | The builder was corrected: the rebuilt archive ships `start_portable.bat` in the folder root with a truthful README (sources only — needs the PC's Python 3.10+ and `pip install -r requirements.txt`). Rebuilt 2026-10-22, 78 files, self-test **PASS 20 / FAIL 0**; the Download Center now describes it accurately and offers it as a source package |
| 10 | **OCR languages beyond English** | Settings expose an “OCR language” choice, but only the English PP-OCRv5 model ships | Marked “Not Verified” on Features, OCR guide and comparison (own row) |
| 11 | **Offline statements from competitors** | Cannot fill “Offline operation” for Adobe/Foxit/PDF-XChange from official pages | Cells marked **Not Verified** with a reason, not guessed |
| 12 | **Evidence for third-party security audit / bug bounty / pen test** | Security page would be dishonest without them | Listed under “What is NOT verified” on `/security/` |
| 13 | **Word→PDF fallback verification** (without MS Word) | Fallback converter unexercised | Conversion guide marks the fallback path “Not Verified”; the Word-COM path is what tests exercised |
| 14 | **Stop did not reach a running single-document OCR job** (found by the gate on 2026-10-17, fixed in the source the same day) — **RESOLVED, fix is in the shipped files** | The cancel was acknowledged but the OCR ran to the end and wrote its result file; the PDF AI Analyst's Stop was dead for the same reason (a property passed where a callable was polled). A second defect in the same area — a Stop issued after the last page still wrote the output — was found while packaging and fixed the same day | Fixed in `server\core\ocr\text_layer.py`, `server\api\jobs.py` + a fixture correction in `tests\_test_batch_compare.py`; gate re-run twice, ending 43/43; mid-document stops measured on the **installed copy** and on the extracted Professional ZIP (cancelled at 5% with no result file on the final 2026-10-22 packages; 12% and 95% on the 2026-10-17 builds). All three packages were rebuilt 2026-10-22 and re-hashed | None — closed 2026-10-22. Hashes are in Verification Report §4 and on the Download Center |
## Cannot verify from project files

- Public domain, hosting location, support inbox, release-signing key, licence text,
  1.0.0 release date, competitor offline behaviour, MSI packaging (does not exist),
  portable ZIP self-sufficiency (contradicted by its contents).
