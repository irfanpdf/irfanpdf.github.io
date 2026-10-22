// Comparison data. Irfan PDF rows come from the project's own code and tests
// (docs/VERIFICATION-REPORT.md). Competitor rows were fetched from the vendors'
// official sites on the verification date and are cited per cell via source ids.
// Anything not confirmed by an official page is marked "Not Verified".

import { SITE } from "@/data/site";

export type Status =
  | "Free"
  | "Paid"
  | "Limited"
  | "Supported"
  | "Not Supported"
  | "Not Verified";

export type Cell = {
  status: Status;
  note?: string;
  src?: string[]; // source ids, see SOURCES
};

export type Row = {
  field: string;
  group: "pricing" | "platform" | "core" | "convert" | "security" | "ai" | "deploy";
  irfan: Cell;
  adobe: Cell;
  foxit: Cell;
  pdfx: Cell;
  pdf24: Cell;
};

export const VERIFIED_ON = "2026-10-16";

export const SOURCES: Record<
  string,
  { label: string; url: string; fetched: string }
> = {
  P0: {
    label:
      "Irfan PDF project files: source, CHANGELOG.md, TEST-REPORT.md, regression gate " +
      `${SITE.gateSuites} suites (${SITE.gateResult}, run ${SITE.gateRunOn})`,
    url: "",
    fetched: SITE.verifiedOn,
  },
  A1: { label: "adobe.com/acrobat.html (product page + FAQ)", url: "https://www.adobe.com/acrobat.html", fetched: "2026-10-16" },
  A2: { label: "adobe.com/acrobat/plans.html (plans & pricing)", url: "https://www.adobe.com/acrobat/plans.html", fetched: "2026-10-16" },
  A3: { label: "adobe.com/acrobat/online.html (online tools catalog)", url: "https://www.adobe.com/acrobat/online.html", fetched: "2026-10-16" },
  A4: { label: "adobe.com/acrobat/free-trial-download.html (trial & pricing)", url: "https://www.adobe.com/acrobat/free-trial-download.html", fetched: "2026-10-16" },
  F1: { label: "foxit.com/pdf-editor/pricing (pricing, features, FAQ)", url: "https://www.foxit.com/pdf-editor/pricing/", fetched: "2026-10-16" },
  X1: { label: "pdf-xchange.com/product/pdf-xchange-editor (features, downloads)", url: "https://www.pdf-xchange.com/product/pdf-xchange-editor", fetched: "2026-10-16" },
  X2: { label: "pdf-xchange.com/pricing (license pricing)", url: "https://www.pdf-xchange.com/pricing", fetched: "2026-10-16" },
  P1: { label: "tools.pdf24.org/en/creator (PDF24 Creator)", url: "https://tools.pdf24.org/en/creator", fetched: "2026-10-16" },
  P2: { label: "tools.pdf24.org/en/ocr-pdf (OCR tool)", url: "https://tools.pdf24.org/en/ocr-pdf", fetched: "2026-10-16" },
  P3: { label: "tools.pdf24.org/en/all-tools (full tool catalog)", url: "https://tools.pdf24.org/en/all-tools", fetched: "2026-10-16" },
};

export const GROUP_LABELS: Record<Row["group"], string> = {
  pricing: "Pricing",
  platform: "Platform",
  core: "Core work",
  convert: "Convert",
  security: "Security",
  ai: "AI features",
  deploy: "Deployment & usability",
};

export const ROWS: Row[] = [
  // ---------------------------------------------------------------- pricing
  {
    field: "Pricing",
    group: "pricing",
    irfan: { status: "Free", note: "No payment, checkout or license-key code exists anywhere in the project.", src: ["P0"] },
    adobe: { status: "Paid", note: "Subscription; Acrobat Pro US$19.99/mo (annual, billed monthly). Perpetual sales discontinued after Acrobat 2020.", src: ["A2", "A4", "A1"] },
    foxit: { status: "Paid", note: "US$129.99/user/year (Editor), US$159.99 (Editor+), monthly billing from US$10.99; perpetual US$209.99 one-time.", src: ["F1"] },
    pdfx: { status: "Paid", note: "Perpetual license from US$62.00 (Editor) / US$79.00 (Editor Plus), includes one year of maintenance.", src: ["X2", "X1"] },
    pdf24: { status: "Free", note: "“Completely free of charge and without any restrictions.”", src: ["P1"] },
  },
  {
    field: "Free usage",
    group: "pricing",
    irfan: { status: "Free", note: "Every feature is available with no tier, trial or watermark.", src: ["P0"] },
    adobe: { status: "Limited", note: "Acrobat Reader is free; full editing/OCR is paid. Online tools are offered as a free trial.", src: ["A1", "A3", "A4"] },
    foxit: { status: "Limited", note: "14-day free trial (no credit card); the separate Foxit PDF Reader is free.", src: ["F1"] },
    pdfx: { status: "Limited", note: "Free version: “70% of features are unrestricted”; licensed features add a watermark.", src: ["X1"] },
    pdf24: { status: "Free", note: "No limits or watermarks, for private and business use.", src: ["P1", "P3"] },
  },
  // -------------------------------------------------------------- platform
  {
    field: "Windows support",
    group: "platform",
    irfan: { status: "Supported", note: "Windows 10 (1809+) or Windows 11, 64-bit — the documented and tested target; the installer itself sets no minimum-version check.", src: ["P0"] },
    adobe: { status: "Supported", note: "Desktop, web and mobile apps.", src: ["A1"] },
    foxit: { status: "Supported", note: "Windows, macOS and web apps (mobile in Editor+).", src: ["F1"] },
    pdfx: { status: "Supported", note: "“MS Windows 10 and later”, 32/64-bit and ARM64 installers.", src: ["X1"] },
    pdf24: { status: "Supported", note: "Windows app (PDF24 Creator), also in the Microsoft Store.", src: ["P1", "P3"] },
  },
  {
    field: "Offline operation",
    group: "platform",
    irfan: { status: "Supported", note: "Server binds 127.0.0.1 only; zero HTTP clients, telemetry or analytics in the code. OCR models are bundled.", src: ["P0"] },
    adobe: { status: "Not Verified", note: "No official statement about offline use found on the fetched pages." },
    foxit: { status: "Not Verified", note: "No official statement about offline use found on the fetched pages." },
    pdfx: { status: "Not Verified", note: "Desktop installers imply local use; no explicit offline statement found on the fetched pages." },
    pdf24: { status: "Supported", note: "Creator works offline “so files stay on your PC”.", src: ["P1"] },
  },
  // ------------------------------------------------------------------ core
  {
    field: "OCR",
    group: "core",
    irfan: { status: "Supported", note: "Searchable and editable OCR, offline RapidOCR/ONNX with the English PP-OCRv5 model; auto-orientation and deskew.", src: ["P0"] },
    adobe: { status: "Supported", note: "“OCR PDF — Recognize text”; scans to searchable/editable PDFs.", src: ["A3", "A1"] },
    foxit: { status: "Supported", note: "“OCR: Scan to searchable PDFs” in the feature matrix.", src: ["F1"] },
    pdfx: { status: "Supported", note: "Default OCR engine in Editor; enhanced engine in Editor Plus; OCR language packages.", src: ["X1"] },
    pdf24: { status: "Supported", note: "“PDF OCR” creates searchable PDFs; Creator ships all PDF24 tools.", src: ["P2", "P3", "P1"] },
  },
  {
    field: "PDF editing",
    group: "core",
    irfan: { status: "Supported", note: "Edit existing text (embedded-font preservation), add text/images/signatures/shapes/highlights; verified by pixel-diff tests.", src: ["P0"] },
    adobe: { status: "Supported", note: "“Edit text and images, rearrange content, organize pages.”", src: ["A1"] },
    foxit: { status: "Supported", note: "“Edit text, images, and pages.”", src: ["F1"] },
    pdfx: { status: "Supported", note: "402-feature editor (257 free / 145 licensed).", src: ["X1"] },
    pdf24: { status: "Supported", note: "Edit PDF, annotate, fill, watermark, crop, page size.", src: ["P3"] },
  },
  {
    field: "Compression",
    group: "core",
    irfan: { status: "Supported", note: "Quick levels plus target-size mode (up to 7 validated passes); image compressor with target size.", src: ["P0"] },
    adobe: { status: "Supported", note: "“Compress PDF — Reduce the size of your PDF.”", src: ["A3"] },
    foxit: { status: "Supported", note: "“Optimize PDF file size.”", src: ["F1"] },
    pdfx: { status: "Supported", note: "Save as Optimized; recompress document images.", src: ["X1"] },
    pdf24: { status: "Supported", note: "Compress PDF and Web optimize PDF tools.", src: ["P3"] },
  },
  {
    field: "Split",
    group: "core",
    irfan: { status: "Supported", note: "Split tool with ranges and per-file outputs (regression-tested).", src: ["P0"] },
    adobe: { status: "Supported", note: "“Split PDF — Separate a file into multiple PDFs.”", src: ["A3"] },
    foxit: { status: "Supported", note: "“Split PDFs into separate files.”", src: ["F1"] },
    pdfx: { status: "Supported", note: "Split document pages; split by size and by guide lines.", src: ["X1"] },
    pdf24: { status: "Supported", note: "Split PDF tool.", src: ["P3"] },
  },
  {
    field: "Merge",
    group: "core",
    irfan: { status: "Supported", note: "Merge several documents into one (regression-tested).", src: ["P0"] },
    adobe: { status: "Supported", note: "“Merge PDFs — Merge multiple files into a single PDF.”", src: ["A3"] },
    foxit: { status: "Supported", note: "“Merge multiple PDFs.”", src: ["F1"] },
    pdfx: { status: "Supported", note: "Combine existing files into a new document; merge document pages.", src: ["X1"] },
    pdf24: { status: "Supported", note: "Merge PDF tool.", src: ["P3"] },
  },
  {
    field: "Batch processing",
    group: "core",
    irfan: { status: "Supported", note: "Up to 200 documents, 7 operations, per-file outcomes, CSV report, Stop honoured between documents and between OCR pages, retry-only-failed.", src: ["P0"] },
    adobe: { status: "Supported", note: "Action Wizard and batch processing across multiple documents.", src: ["A1"] },
    foxit: { status: "Not Verified", note: "No batch-processing statement found on the fetched pages." },
    pdfx: { status: "Not Verified", note: "No general batch-processing statement found on the fetched pages." },
    pdf24: { status: "Not Verified", note: "No batch-processing statement found on the fetched pages." },
  },
  // --------------------------------------------------------------- convert
  {
    field: "PDF to Word",
    group: "convert",
    irfan: { status: "Supported", note: "pdf2docx with Microsoft Word COM as accuracy fallback; end-to-end tested.", src: ["P0"] },
    adobe: { status: "Supported", note: "“PDF to Word — Convert a PDF to a Microsoft Word file.”", src: ["A3"] },
    foxit: { status: "Supported", note: "“Convert to/from Word, Excel, PowerPoint.”", src: ["F1"] },
    pdfx: { status: "Supported", note: "“Convert PDF Files to MS Word Format.”", src: ["X1"] },
    pdf24: { status: "Supported", note: "PDF to Word and PDF to DOCX tools.", src: ["P3"] },
  },
  {
    field: "Image conversion",
    group: "convert",
    irfan: { status: "Supported", note: "JPG/PNG→PDF, PDF→images, image→Word, image→text, extract embedded images.", src: ["P0"] },
    adobe: { status: "Supported", note: "JPG/PNG/HEIC…→PDF and PDF→JPG/PNG tools.", src: ["A3"] },
    foxit: { status: "Supported", note: "“Convert … to image formats”, JPG/PNG to PDF tools.", src: ["F1"] },
    pdfx: { status: "Supported", note: "Image files→PDF; PDF→WebP images (other raster exports listed as licensed features).", src: ["X1"] },
    pdf24: { status: "Supported", note: "Images to PDF, PDF to Images/JPG/PNG/SVG/TIFF, HEIC/WEBP converters.", src: ["P3"] },
  },
  {
    field: "PDF to Excel",
    group: "convert",
    irfan: { status: "Supported", note: "Real .xlsx built from column geometry; opened and validated in Excel.", src: ["P0"] },
    adobe: { status: "Supported", note: "“PDF to Excel” tool.", src: ["A3"] },
    foxit: { status: "Supported", note: "“Convert to/from … Excel.”", src: ["F1"] },
    pdfx: { status: "Supported", note: "“Convert PDF Files to MS Excel Format.”", src: ["X1"] },
    pdf24: { status: "Supported", note: "PDF to Excel and PDF to XLSX tools.", src: ["P3"] },
  },
  // -------------------------------------------------------------- security
  {
    field: "Security (password / redact)",
    group: "security",
    irfan: { status: "Supported", note: "AES-256 protection, password removal, permanent redaction proven by re-reading output; signed PDFs are refused, not modified.", src: ["P0"] },
    adobe: { status: "Supported", note: "“Protect PDF — Set a password”; permanent redaction in Acrobat Pro.", src: ["A3", "A1"] },
    foxit: { status: "Supported", note: "Password protection & security; manual redaction.", src: ["F1"] },
    pdfx: { status: "Supported", note: "Security policies, digital signatures, redaction tools.", src: ["X1"] },
    pdf24: { status: "Supported", note: "Protect PDF, Unlock PDF, Redact PDF, remove metadata.", src: ["P3"] },
  },
  // -------------------------------------------------------------------- ai
  {
    field: "AI features",
    group: "ai",
    irfan: { status: "Supported", note: "Local quoted-text analysis (Assistant) and document Analyst — no cloud, no API key, no language model; test-enforced.", src: ["P0"] },
    adobe: { status: "Supported", note: "AI Assistant / PDF Spaces; AI Assistant Plus from US$4.99/mo on top of Acrobat.", src: ["A4", "A1"] },
    foxit: { status: "Supported", note: "AI Assistant included with 300 credits/month (2,000 with the paid add-on).", src: ["F1"] },
    pdfx: { status: "Supported", note: "AI Assistant supporting OpenAI/Anthropic/Google — only with your own API key.", src: ["X1"] },
    pdf24: { status: "Not Verified", note: "No AI feature listed in the fetched tool catalog." },
  },
  // --------------------------------------------------------------- deploy
  {
    field: "Portable deployment",
    group: "deploy",
    irfan: { status: "Supported", note: "Self-contained Professional ZIP: extract and run, includes its own Python runtime and the test suite.", src: ["P0"] },
    adobe: { status: "Not Verified", note: "No official portable (no-install) package found on the fetched pages." },
    foxit: { status: "Not Verified", note: "No official portable package found on the fetched pages." },
    pdfx: { status: "Supported", note: "Official “Editor Portable Version” downloads (incl. x64, with or without OCR).", src: ["X1"] },
    pdf24: { status: "Not Verified", note: "Desktop apps listed (Creator, PDF Printer, Reader); no portable package found on the fetched pages." },
  },
  {
    field: "Usability — starts without an account or connection",
    group: "deploy",
    irfan: { status: "Supported", note: "No account (sign-in off by default), no internet, no admin rights for the installer.", src: ["P0"] },
    adobe: { status: "Not Verified", note: "Account/activation requirements were not confirmed on the fetched pages." },
    foxit: { status: "Not Verified", note: "Account requirements were not confirmed on the fetched pages." },
    pdfx: { status: "Not Verified", note: "Account requirements were not confirmed on the fetched pages." },
    pdf24: { status: "Supported", note: "Online tools: “No installation or registration required”; Creator is free for private and business use.", src: ["P3", "P1"] },
  },
];

export const PRODUCTS = [
  { key: "irfan", name: "Irfan PDF", highlight: true },
  { key: "adobe", name: "Adobe Acrobat", highlight: false },
  { key: "foxit", name: "Foxit PDF Editor", highlight: false },
  { key: "pdfx", name: "PDF-XChange Editor", highlight: false },
  { key: "pdf24", name: "PDF24 Creator", highlight: false },
] as const;

export type ProductKey = (typeof PRODUCTS)[number]["key"];
