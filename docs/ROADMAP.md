# Roadmap — Irfan PDF website & product

**Date:** 2026-10-16 · **Version covered:** 1.7.0

Two strictly separated lists. Nothing in *Planned* exists today.

## CURRENT FEATURES (shipped and test-verified)

| Capability | Evidence (regression suite; 2026-10-17 gate: 43 of 43 suites pass) |
|---|---|
| Searchable & editable OCR, offline (English PP-OCRv5), auto-orientation + auto-deskew | `_test_ocr_fidelity` (19), `_test_deskew` (16), `recert_freshness` (12), `test_e2e` (37) |
| Full PDF editor incl. embedded-font preservation | `_test_font_preserve` (24), `_test_style_edit` (13), `_test_edit_keeps_form` (14) |
| Conversions: PDF↔Word, Word→PDF, images↔PDF, PDF→Excel, image→text, extract images | `test_e2e` (37), `_test_extract_tools` (34) |
| Compression with target size (7 measured passes) | `_test_compress_target` (22) |
| Batch processing up to 200 files (7 operations, CSV, Stop, retry-failed) | `test_batch_compare` (46), `test_tool_wiring` (55) |
| Compare documents (word diff + pixel page diff, HTML report) | `test_compare_engine` (21) |
| Security: AES-256, password removal, permanent redaction, signed-file refusal | `test_security_pages` (73), `_test_password_pdf` (23) |
| Local document AI: PDF AI Assistant (quoted answers) + PDF AI Analyst (cited analysis, Office exports) | `_test_doc_ai` (34), `test_analyst` (36), `test_analyst_exports` (44) |
| Print (ranges, N-up, true paper size), full-text search, optional multi-user, health check | `test_print` (78), `_test_text_search` (38), `_test_auth_users` (71), `test_health_check` (23) |
| Self-contained installers (bundled runtime), per-user setup, portable Professional ZIP | `irfan_pdf.iss`, `test_package` (52) |

Source: `tests/run_regression.py` run twice on 2026-10-17 (43 of 43 suites after the Stop fix that the first run surfaced; `docs/TESTING-REPORT.md` §10); `docs/VERIFICATION-REPORT.md`.

## PLANNED / FUTURE (not implemented — do not advertise)

1. **More OCR languages** — additional recognition models beyond the bundled English PP-OCRv5 model.
2. **Improved layout preservation on complex documents** — dense multi-column layouts and complex table headers.
3. **Newer OCR/recognition models** — evaluate updated local models as released.
4. **Enterprise deployment tooling** — MSI packaging and silent-deployment documentation (today: per-user EXE installer only).
5. **App accessibility audit** — screen-reader/keyboard audit of the desktop UI (the website itself already targets keyboard/contrast/semantics checks).
6. **Code-signed installers** — Authenticode signing so SmartScreen shows a verified publisher (current artifacts: `NotSigned`).
7. **Performance work** — continue measured optimisation (see preview-cache measurements in CHANGELOG 1.7.0).

## Website-side follow-ups (this project)

* **Publish download links** by setting `NEXT_PUBLIC_DOWNLOAD_BASE_URL` (requires a file host).
* **Set `NEXT_PUBLIC_SITE_URL`** to the real domain to enable canonical URLs and the sitemap (indexing is already on; only unverified URLs are withheld).
* ~~**Rebuild `IrfanPDF_Portable.zip`** (or re-document it)~~ — **done 2026-10-22**: the archive now ships `start_portable.bat` in the root with a truthful source-only README (78 files, self-test PASS 20 / FAIL 0).
* Refresh `public/screenshots/` after major UI releases; screenshots are real captures dated 2026-10-16.
* Re-run the competitor citation fetches (`src/data/comparison.ts`, `SOURCES`) when re-verifying prices — verification date is currently 2026-10-16.
