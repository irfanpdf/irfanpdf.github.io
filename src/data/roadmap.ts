// Roadmap: two strictly separated lists. CURRENT = shipped and test-verified.
// PLANNED = ideas only - never presented as existing capabilities.

export type CurrentItem = {
  title: string;
  detail: string;
  evidence: string;
};

export type PlannedItem = {
  title: string;
  detail: string;
  status: "Planned / Future";
};

export const CURRENT: CurrentItem[] = [
  {
    title: "Searchable & editable OCR (offline)",
    detail:
      "Invisible text layer or fully editable text, English PP-OCRv5 model bundled, auto-orientation and automatic deskew.",
    evidence: "_test_ocr_fidelity (19), _test_deskew (16), recert_freshness (12)",
  },
  {
    title: "Full PDF editor with font preservation",
    detail:
      "Edit existing text in the document's own embedded font; add text, images, signatures, shapes and highlights.",
    evidence: "_test_font_preserve (24), _test_style_edit (13), _test_edit_keeps_form (14)",
  },
  {
    title: "Conversions: Word, Excel, images",
    detail: "PDF↔Word, Word→PDF, JPG/PNG→PDF, PDF→images, PDF→Excel, image→text.",
    evidence: "test_e2e (37), _test_extract_tools (34)",
  },
  {
    title: "Compression with a target size",
    detail:
      "Quick levels or an exact MB target with up to seven validated passes and honest shortfall reporting.",
    evidence: "_test_compress_target (22)",
  },
  {
    title: "Batch processing (up to 200 files)",
    detail: "Seven operations, CSV report, per-file outcomes, Stop honoured between documents and between OCR pages, retry-only-failed.",
    evidence: "test_batch_compare (46), test_tool_wiring (55)",
  },
  {
    title: "Compare documents",
    detail: "Word-level diff plus pixel-by-pixel page comparison in one offline HTML report.",
    evidence: "test_compare_engine (21)",
  },
  {
    title: "Security: password, redaction, signed-file refusal",
    detail:
      "AES-256 protection, permanent redaction, and refusal to touch digitally signed PDFs.",
    evidence: "test_security_pages (73), _test_password_pdf (23)",
  },
  {
    title: "Local document AI",
    detail:
      "PDF AI Assistant (quoted answers) and PDF AI Analyst (classification, cited analysis, Office exports).",
    evidence: "_test_doc_ai (34), test_analyst (36), test_analyst_exports (44)",
  },
  {
    title: "Print, search, multi-user, health check",
    detail:
      "True-size print with N-up, full-text library search, optional accounts with roles, 20+ check self-test.",
    evidence: "test_print (78), _test_text_search (38), _test_auth_users (71), test_health_check (23)",
  },
];

export const PLANNED: PlannedItem[] = [
  {
    title: "More OCR languages",
    detail:
      "Additional recognition models beyond the bundled English PP-OCRv5 model (other languages are Not Verified today).",
    status: "Planned / Future",
  },
  {
    title: "Improved layout preservation on complex documents",
    detail:
      "Extend the current fidelity guarantees to harder layouts (dense multi-column reports, complex table headers).",
    status: "Planned / Future",
  },
  {
    title: "Newer OCR and recognition models",
    detail: "Evaluate updated local models for accuracy and speed as they are released.",
    status: "Planned / Future",
  },
  {
    title: "Enterprise deployment tooling",
    detail:
      "MSI packaging and silent-deployment documentation for managed environments (today: per-user EXE installer only).",
    status: "Planned / Future",
  },
  {
    title: "Accessibility improvements in the app UI",
    detail:
      "A screen-reader and keyboard audit of the desktop interface (the website itself targets WCAG-oriented checks today).",
    status: "Planned / Future",
  },
  {
    title: "Code-signed installers",
    detail:
      "Authenticode signing so Windows SmartScreen shows a verified publisher (current artifacts are unsigned).",
    status: "Planned / Future",
  },
  {
    title: "Performance improvements",
    detail: "Continue the measured optimisation work (see the preview-cache measurements in the changelog).",
    status: "Planned / Future",
  },
];
