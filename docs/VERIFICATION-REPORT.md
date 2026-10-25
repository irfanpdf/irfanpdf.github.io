# IRFAN PDF — STEP 1: PROJECT INSPECTION & VERIFICATION REPORT

**VerDate:** 2026-10-16
**Subject:** the `docuforge` application checkout (application source, build outputs, documentation)
**Method:** every claim below was checked against an actual project file or an executed test run.
Anything not confirmed is marked **Not Verified** and must not be advertised.

Evidence sources used:

- Source tree: `server/`, `web/`, `desktop/`, `build/`, `installer/`, `tools/`, `tests/`
- `CHANGELOG.md` (v1.0.0 → 1.7.0), `README.md`, `TEST-REPORT.md` (2026-10-05),
  `dist\IRFAN-PDF\INSTALLATION-GUIDE.md`, `installer\irfan_pdf.iss`, `requirements.txt`
- Artifact hashes: `Get-FileHash SHA256` on the three `dist\` packages (run 2026-10-16)
- Authenticode: `Get-AuthenticodeSignature` on installer and launcher (run 2026-10-16)
- Full regression gate run on **2026-10-17** (`py -3.12 tests\run_regression.py`, app on
  127.0.0.1:8765): **43 of 43 suites pass, 0 failures** — including `test_e2e` 37/37,
  `test_document_integrity` 52/52, `test_package` 52/52, `test_batch_compare` 46/46 and
  `test_deskew` 16/16. Both runs of that day are kept as evidence:
  `docs/evidence/regression-gate-2026-10-17-before-fix.txt` (42/43 — the suite that
  found the Stop defect) and `…-after-fix.txt` (43/43). See §10 of TESTING-REPORT.md.
- Privacy scan: grep for `requests|httpx|urlopen|telemetry|analytics|sentry|gtag`
  over `server/` and `web/js/` → **no HTTP client, no telemetry, no analytics code**
- Competitor claims (Compare page) were fetched from official vendor sites on
  2026-10-16 and are cited on the page itself.

---

## 1. Verified Features

Only features that exist in the shipped code and were exercised by a test are listed.
"Evidence" names the actual suite (check count from the 2026-10-16 gate) or file.

### Viewing & navigation
| Feature | Evidence |
|---|---|
| Open/render PDFs, page thumbnails & cached previews (disk-cached JPEGs, size+mtime key) | `server/api/files.py`, CHANGELOG 1.7.0 (measured 0.08 s folder paint vs ~78 s before), `test_e2e` (37) |
| Editor zoom: Whole page / Fill width / Actual size (measured 595×842 px at actual size) | CHANGELOG 1.7.0, `test_e2e` |
| Print: page ranges, N-up (2/4/6/8/9), 200-DPI print view at true paper size, Windows hand-over | `test_print` (78), `test_print_api` (63) |

### Editing
| Feature | Evidence |
|---|---|
| Edit existing text: font, size, colour, bold/italic, alignment — on native and OCR'd PDFs | `_test_style_edit` (13), `_test_editor_shade` (10) |
| Edited words come out in the document's own embedded font at own size/weight/colour | `_test_font_preserve` (24) |
| Add text boxes, images, signatures (draw/upload/type), rectangles, ellipses, lines, arrows, highlights, free-hand drawing; 8-handle move/resize; undo/redo; autosave restore | `test_tool_wiring` (55), README §4 |
| Editing a scanned form keeps borders/grid/rules (covers fitted to ink, named redaction constants) | `_test_edit_keeps_form` (14), `_test_ocr_fidelity` (19) |
| Scanned-text edit box matches printed word width | `_test_scanned_edit_size` (13) |

### OCR
| Feature | Evidence |
|---|---|
| **Searchable OCR** — invisible text layer, original appearance preserved, word-level placement/size/colour | `_test_ocr_fidelity` (19), `recert_freshness` (12), `recert2_analysis` (11), `test_document_integrity` (52) |
| **Editable OCR** — raster glyphs covered, real selectable/editable text inserted at original positions; table cells in reading order; multi-page per-page progress | `test_e2e` (37), `_test_ocr_spaces` (6), `_test_table_columns` (16) |
| Engine: RapidOCR (`rapidocr-onnxruntime` 1.4.4) on ONNX Runtime with the official English PP-OCRv5 recognition model — fully offline, no Tesseract install needed | `requirements.txt`, `server/core/ocr/engine.py`, CHANGELOG 1.0.0 |
| Auto-orientation of sideways/upside-down scans + **automatic deskew** of tilted scans at upload (0.30–5.00° window, flat-scan-only guards) | CHANGELOG 1.0.0; `_test_deskew` (16, added 2026-10-16) |
| Image to Text: OCR a picture → editable text on screen → save `.txt` | `_test_extract_tools` (34) |

### Convert
| Feature | Evidence |
|---|---|
| PDF → Word (.docx, pdf2docx with Microsoft Word COM as accuracy fallback) | `test_e2e` (37), `server/core/convert/` |
| Image (JPG/PNG) → Word (paragraph/table-aware DOCX) | `test_e2e` (37) |
| Word → PDF (Microsoft Word COM; built-in fallback described in README — fallback path itself **Not Verified** without Word) | `server/core/convert/`, health check |
| JPG/PNG → PDF; PDF → Images (every page rendered) | health check (`server/health.py`), `test_tool_wiring` (55) |
| Extract Images — writes embedded picture objects, reopens and validates pixel dimensions, dedupes | `_test_extract_tools` (34) |
| PDF → Excel — `.xlsx` written from scratch, validated structurally **and opened in real Excel** (numbers read back as numbers, formulas compute) | `_test_extract_tools` (34) |
| Extract text → `.txt` honouring page selection | `test_security_pages` (73) |

### Organise
| Feature | Evidence |
|---|---|
| Merge, Split, Rotate, Delete pages, Extract pages | `test_tool_wiring` (55), README §4 |
| Duplicate pages, insert blank page, reorder, crop, resize (A3/A4/A5/Letter/Legal), remove blank pages (safe detection: no text + no images + no drawings) | `test_security_pages` (73) |
| Compress: Quick (Low/Medium/High) **and target size** (up to 7 validated passes; already-small file copied byte-for-byte; honest shortfall warning) | `_test_compress_target` (22) |
| Image Compressor (JPG/JPEG/PNG/WEBP/TIFF, quick + target size, states when resolution was reduced) | `_test_image_tools` (28), `_test_image_tools_api` (18) |
| Image Quality Enhancer 2x/4K/8K — OpenCV denoise + CLAHE + sharpen + Lanczos upscale; **explicitly labelled "not an AI upscaler" in code and UI, `is_ai: false`** | `_test_image_tools` (28) |

### Security
| Feature | Evidence |
|---|---|
| Protect with password — real AES-256; output proven to refuse a blank password | `test_security_pages` (73), `_test_password_pdf` (23) |
| Remove password (wrong password reported, never ignored) | `_test_password_pdf` (23) |
| Redact text — permanent: characters deleted via `apply_redactions()`, re-read and proven gone | `test_security_pages` (73) |
| Watermark, page numbers, flatten forms, greyscale, repair, document details | `test_security_pages` (73), `test_tool_wiring` (55) |
| **Digitally signed PDFs are refused** (with explanation) for OCR/export instead of being silently invalidated; encrypted PDFs refused with a named fix | regression gate 2026-10-16 (`a signed PDF is refused without confirmation`, `nothing was written when refused`), `_test_password_pdf` (23) |

### Batch & compare
| Feature | Evidence |
|---|---|
| Compare documents — word-level text diff + page-by-page pixel diff in one self-contained HTML report | `test_compare_engine` (21) |
| Batch processing up to 200 documents (watermark, compress, rotate, page numbers, greyscale, remove-blank, resize), per-file outcomes, CSV report, working Stop, retry-only-failed | `test_batch_compare` (46), `test_tool_wiring` (55) |

### Search & local AI
| Feature | Evidence |
|---|---|
| Full-text library search (names + content, AND matching, snippet + "IN TEXT" badge, index rebuild/purge) | `_test_text_search` (38), `_test_index_purge` (10) |
| PDF AI Assistant — **local text analysis** (overview, summary, key points, extracted dates/amounts/refs, page-scoped Q&A); every sentence quoted verbatim from the file and re-verified server-side; module contains no API key, URL or network call (test-enforced) | `_test_doc_ai` (34), `_test_doc_ai_api` (18) |
| PDF AI Analyst — classification, automatic OCR for scans, A-X cited analysis, export to Word/Excel/PowerPoint | `test_analyst` (36), `test_analyst_exports` (44), `test_analyst_api` (40) |

### Platform
| Feature | Evidence |
|---|---|
| Runs 100 % local: server binds `127.0.0.1` only (`server/config.py`); no telemetry, no analytics, no external HTTP calls (grep: zero matches) | `README.md` §7, code grep 2026-10-16 |
| Optional multi-user sign-in (off by default): ADMIN/USER roles, per-tool permissions, PBKDF2-HMAC-SHA256 (600 000 iterations), login rate limit 5 failures/5 min, last-admin guard | `_test_auth_users` (71), CHANGELOG 1.6.0/1.7.0 |
| Health check / self-test — 20+ real executed operations, repair, diagnostic export | `test_health_check` (23), `server/health.py` |
| Native desktop window (pywebview) with browser fallback; single-instance `.exe` launcher; PDF file association + "Open with" verb | `desktop/main.py`, `build/launcher/Program.cs`, `installer/irfan_pdf.iss` |
| Dark/light theme, responsive layout, keyboard shortcuts (Ctrl+Z/Y, Alt+Left, Ctrl+F5) | `web/css/app.css`, CHANGELOG 1.7.0 |
| Security hardening: DNS-rebinding Host check, Origin guard, 415/403 cross-site refusal, 512 MB request ceiling, `nosniff`/`SAMEORIGIN`/`no-referrer`, PBKDF2 600k, no raw tracebacks to client | CHANGELOG 1.7.0 (8+4 findings) |

### Document preservation (verified in tests)
- Page dimensions and layout preserved: `test_document_integrity` (52).
- Signatures/stamps/digits/visual appearance preserved through OCR: `_test_ocr_fidelity` (19),
  `recert_freshness` (12), `recert2_analysis` (11), `_test_font_preserve` (24).
- Digitally signed documents are **refused, not modified** (gate 2026-10-17, `test_document_integrity` 52/52).
- Never claimed: 100 % signature validity after modification — digitally signed files are
  refused precisely because adding a text layer would invalidate them.

---

## 2. Unverified Features (do not advertise)

| Item | Status |
|---|---|
| Tesseract backend | Code path exists (`engine.py` fallback) but no Tesseract ships in the package — **Not Verified** in shipped builds |
| OCR in languages other than English | An "OCR language" setting exists, but only the official **English** PP-OCRv5 model is bundled and verified — other languages **Not Verified** |
| Word →PDF fallback converter (no Microsoft Word installed) | Implemented per README; the COM path is what was exercised — fallback path **Not Verified** |
| Single-file `.exe` application | Explicitly *not produced* (CHANGELOG 1.1.0 known limitations) |
| MSI installer | **None exists** — the only installer is the Inno Setup EXE |
| Anything described as "cloud", "sync", "mobile", "web version" | Does not exist — the product is a Windows desktop app |
| AI image upscaling | Product explicitly states it is **not** AI upscaling (`is_ai: false`, on-screen label) |
| Chat/LLM document AI | The Assistant is local quoted-text analysis with no language model — do not present it as an LLM |

## 3. Missing Information (required to publish, not found in project files)

1. **Public domain / canonical URL** for the website — none exists → `NEXT_PUBLIC_SITE_URL`
   must be supplied at build time; canonical/OG/sitemap are omitted until then.
2. **Public download URLs** for the three packages — files exist only on this machine →
   Download Center renders verified metadata with download links in a "link not configured"
   state until `NEXT_PUBLIC_DOWNLOAD_BASE_URL` is set. (No placeholder links are used.)
3. **Screenshots** — none ship in the repository. The website uses screenshots captured
   from the real running application (a clean-profile instance), labelled as such.
4. **Contact/support channel** — no email, forum or issue tracker in any project file →
   the Contact page says so and lists exactly what a support request should include
   (health report + logs), per `INSTALLATION-GUIDE.md`.
5. **License text** — no `LICENSE` file; README §9 only states "Original code and design
   built for this project". Terms page states what is known and nothing more.
6. **Release date of 1.0.0** — CHANGELOG says "1.0.0 - earlier", no date.
7. **Code-signing certificate** — no signature on any artifact (see §4); no certificate
   metadata anywhere in the project.
8. **CI/CD** — no `.github/`, no workflow files of any kind.
9. **`IrfanPDF_Portable.zip` integrity** — **found broken, then fixed.** The 2026-10-14
   archive's bundled README claimed "Python is already inside the application", but it
   contained **no runtime** and **no root `start_portable.bat`** although the README's
   quick start said to double-click it. The builder was corrected so the archive ships
   `start_portable.bat` in the folder root with a truthful README (sources only; needs
   the PC's Python 3.10+ and `pip install -r requirements.txt`), and the archive was
   rebuilt on 2026-10-22: 78 files, launcher at the root, no bundled runtime — and it
   passes the application's own self-test (PASS 20 / FAIL 0) on this machine.

## 4. Download Artifacts (measured 2026-10-22)

| File | Version | Bytes | SHA-256 | Built | Type | Digital signature |
|---|---|---|---|---|---|---|
| `IrfanPDF_Setup_1.7.0.exe` | 1.7.0 | 115,995,494 | `C57968BA6397622A01BE912504D8D2CEABBACCA4F1074ED767C87EDD46D0A7C5` | 2026-10-22 | Inno Setup 6 installer, per-user (no admin required), 64-bit, bundled runtime | **NotSigned** |
| `IRFAN-PDF-PROFESSIONAL.zip` | 1.7.0 | 155,787,006 | `02B95E2487EBB441EF841D5AE671E97C3AE9AF0D2176CE835B4906E99897F4D9` | 2026-10-22 | Self-contained portable package: 4,452 files (365.6 MiB extracted) incl. `Application\runtime\` (4,195 files / 355.8 MiB) + shipped test suite (166 files, incl. a `tests\README.txt` the builder adds) | n/a (ZIP) |
| `IrfanPDF_Portable.zip` | 1.7.0 | 7,705,955 | `72EAA80178D867372872658F5AFCFC38BC40101B60BD62D0BFC936788BA8FD98` | 2026-10-22 | Source-package ZIP (no bundled runtime): 78 files, `start_portable.bat` in the folder root — needs the PC's Python 3.10+ | n/a (ZIP) |

Each file was verified by running it, not just by hashing it (2026-10-22):
the installer was run `/VERYSILENT /CURRENTUSER` into a clean folder (4,195 runtime
files and 165 test files on disk, no PDF association because the probe used `/TASKS=`;
self-test **PASS 20 / FAIL 0**; a Stop on a 12-page scan at 5% ended `cancelled` with
no output file; the uninstaller then removed everything it had installed), the
Professional ZIP was extracted and self-tested with its own bundled runtime (PASS 20 /
FAIL 0, same Stop test at 5%), and the source ZIP was extracted and self-tested with
this machine's Python (PASS 20 / FAIL 0).

- Version source of truth: `server/config.py` → `VERSION = "1.7.0"`; installer `#define AppVersion "1.7.0"`.
- Supported OS (verified text, `INSTALLATION-GUIDE.md`): **Windows 10 (1809 or newer) or Windows 11, 64-bit. Nothing else required** for the installer and the Professional ZIP.
- Release-date evidence: CHANGELOG `## 1.7.0 final build - 2026-10-11`; the three packages on disk were rebuilt 2026-10-22 and carry the Stop fix (entry dated 2026-10-17) and the editor font-inheritance fix (entry dated 2026-10-22); gate re-run 2026-10-17.

## 5. Available Assets

| Asset | Location | Notes |
|---|---|---|
| Application icon / favicon | `IrfanPDF.ico`, `web/favicon.ico`, `dist\IRFAN-PDF\Icons\{IrfanPDF.ico, favicon.ico}` (18,826 B each) | 9 sizes 16–256 px, red tile (#FF0000→#CC0000) + white **IP** monogram + folded corner; generated by `tools/make_icon.py` from the sidebar-logo geometry |
| Sidebar logo geometry | `web/` (inline SVG) | Same geometry as the icon |
| Screenshots | *none in repo* → captured from the running app into `public/screenshots/` | Real UI, clean profile, no user documents |
| Test reports | `TEST-REPORT.md`, `IrfanPDF_Test_Report.html`, `IrfanPDF_Final_Test_Report.html`, `IrfanPDF_Startup_Diagnostic.html` | 40/40 suites, 1,093 checks, 2026-10-05 |
| Documentation | `README.md`, `CHANGELOG.md` (1.0.0→1.7.0), `dist\IRFAN-PDF\README.md`, `INSTALLATION-GUIDE.md`, `API_CONTRACT.md` | Basis for the Documentation section |
| Build scripts | `build/build_installer.ps1`, `build/build_portable.ps1`, `build/build_professional.ps1`, `build/vendor_runtime.py`, `installer/irfan_pdf.iss` | Installer compile: ISCC.exe against `irfan_pdf.iss` |

**Executed-test record used on the site:** regression gate 2026-10-17 → **43 of 43 suites passing, 0 failures**
(after the Stop fix that the same day's first run surfaced — `test_batch_compare` 43/46 → 46/46; analysis in §10
of TESTING-REPORT.md); shipped report 2026-10-05 → 40 suites / 1,093 declared checks / 40-40 / PASS;
in-app self-test `PASS 20 FAIL 0` (2026-10-16, installed copy, bundled runtime).

---

## Re-verification pass — 2026-10-17

Every published number below was re-measured from the project files on **2026-10-22**, not copied forward.

| Item | Re-check | Result |
|---|---|---|
| SHA-256 of all three release packages | `Get-FileHash -Algorithm SHA256` on `dist\*.exe`, `dist\*.zip` | **Identical to the published values** (setup `C57968…D0A7C5`, professional `02B95E…97F4D9`, portable `72EAA8…A8FD98`) — re-measured after the final 2026-10-22 rebuild, which ships the editor font-inheritance fix |
| Package sizes | same command | 115,995,494 / 155,787,006 / 7,705,955 bytes — identical |
| Professional ZIP contents | ZIP central directory + extraction | **4,452 files** (365.6 MiB uncompressed); `Application\runtime\` = **4,195 files / 355.8 MiB**; `Application\tests\` = 166 files (165 sources + the builder's `README.txt`) |
| Shipped `TEST-REPORT.md` | read directly | 40 suites, 1,093 declared checks, 40/40 passing, generated 2026-10-05 — confirms what the site states |
| CHANGELOG versions | read directly | 1.0.0 → 1.7.0 (final build 2026-10-11); 1.0.0 is recorded as "earlier" and the site gives it no invented date |
| OCR stack | `requirements.txt` | `rapidocr-onnxruntime==1.4.4`, `onnxruntime==1.30.0` — matches the site's RapidOCR/ONNX wording |
| Loopback-only binding | `server/main.py` lines 119-143 | server binds `127.0.0.1` by default and only allows loopback host headers — privacy claim confirmed |
| Windows requirement | `installer\irfan_pdf.iss`, `INSTALLATION-GUIDE.md` | requirement text comes from the shipped guide; the installer declares `ArchitecturesInstallIn64BitMode=x64compatible` but **no `MinVersion`**, and the app has no OS check — the site now says exactly this |

### Corrections made from this pass

1. **Professional ZIP file counts** — the site previously said "4,494 files … 4,230 runtime files". Corrected to the
   measured **4,195 runtime files** on the Download Center, in the installation guide page and here (the archive now
   holds **4,452 files** in total after the 2026-10-17 rebuild).
2. **Disk-space figures** — the earlier "382 MB clean install / ~350 MB runtime, measured in the shipped test report"
   sentence was removed: `TEST-REPORT.md` contains no such measurement. The pages now publish the measured
   archive figures (365.6 MiB expanded, 355.8 MiB runtime, measured 2026-10-17) and say where they come from.
3. **Windows requirement wording** — added that the installer sets no minimum version itself.
4. **Comparison field count** — the Compare hero said "Fourteen fields" while the table holds 17; it now derives the
   number from the data (`ROWS.length`).
