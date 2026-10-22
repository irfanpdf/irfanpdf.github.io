// Verified feature inventory. Source: docs/VERIFICATION-REPORT.md (STEP 1).
// Every entry maps to a shipped capability exercised by the regression suite.

import type { IconName } from "@/components/icons";

export type Feature = {
  title: string;
  blurb: string;
  icon: IconName;
};

export type FeatureGroup = {
  id: string;
  title: string;
  summary: string;
  color: string; // card accent
  items: Feature[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "view",
    title: "PDF viewing",
    summary:
      "Open documents, browse pages with cached thumbnails, and read at the zoom you choose.",
    color: "#0ea5e9",
    items: [
      {
        title: "Fast page previews",
        blurb:
          "Every page is rasterised once and cached on disk as a small JPEG — reopening a folder paints instantly.",
        icon: "eye",
      },
      {
        title: "Real zoom modes",
        blurb:
          "Whole page, Fill width and Actual size — measured at exactly 595 × 842 px for an A4 page.",
        icon: "zoom",
      },
      {
        title: "Page thumbnails",
        blurb: "Jump through the document from a thumbnail strip in the editor.",
        icon: "pages",
      },
      {
        title: "Windows integration",
        blurb:
          "Desktop and Start Menu shortcuts, .pdf file association and an “Open with Irfan PDF” menu entry.",
        icon: "windows",
      },
    ],
  },
  {
    id: "edit",
    title: "PDF editing",
    summary:
      "Change existing text and add new content — while the page keeps looking like the original.",
    color: "#8b5cf6",
    items: [
      {
        title: "Edit existing text",
        blurb:
          "Click any span and retype it, with font, size, colour, weight and alignment controls.",
        icon: "pen",
      },
      {
        title: "True font preservation",
        blurb:
          "An edited word is written back with the document's own embedded font at its own size, weight, colour and spacing.",
        icon: "type",
      },
      {
        title: "Add text, images and signatures",
        blurb:
          "Draw, upload or type a signature; place text boxes and pictures anywhere on the page.",
        icon: "signature",
      },
      {
        title: "Shapes and annotation",
        blurb:
          "Rectangles, ellipses, lines, arrows, highlights and free-hand drawing, all resizeable with 8 handles.",
        icon: "shapes",
      },
      {
        title: "Undo, redo and autosave",
        blurb:
          "Ctrl+Z / Ctrl+Y, plus a restorable draft if you close a document before saving.",
        icon: "undo",
      },
      {
        title: "Form-safe editing",
        blurb:
          "Covers are fitted to the ink they hide, so table borders, rules and grids survive an edit (verified pixel-by-pixel).",
        icon: "grid",
      },
    ],
  },
  {
    id: "ocr",
    title: "OCR",
    summary:
      "Turn scans and photos into text you can search, select and fix — offline, with the English PP-OCRv5 model.",
    color: "#10b981",
    items: [
      {
        title: "Searchable OCR",
        blurb:
          "An invisible text layer is added over the original pixels: the page looks untouched, the words become findable.",
        icon: "scan",
      },
      {
        title: "Editable OCR",
        blurb:
          "Recognised words are inserted as real, selectable, editable text at their original positions — tables included.",
        icon: "textCursor",
      },
      {
        title: "Auto-orientation and deskew",
        blurb:
          "Sideways or upside-down scans are turned upright on upload, and tilted pages (0.3–5°) are straightened automatically.",
        icon: "rotate",
      },
      {
        title: "Image to Text",
        blurb:
          "OCR a photo or screenshot, correct the words on screen, and save a .txt file.",
        icon: "image",
      },
      {
        title: "Fully offline engine",
        blurb:
          "RapidOCR on ONNX Runtime with bundled models — no Tesseract install, no internet, no API keys.",
        icon: "offline",
      },
    ],
  },
  {
    id: "convert",
    title: "Conversions",
    summary:
      "Move documents between PDF, Word, Excel and images with validation before anything is called “done”.",
    color: "#3b82f6",
    items: [
      {
        title: "PDF to Word",
        blurb:
          "Native layout converted with pdf2docx, using Microsoft Word itself as an accuracy fallback when installed.",
        icon: "fileWord",
      },
      {
        title: "Image to Word",
        blurb: "JPG/PNG scanned pages become a paragraph- and table-aware .docx.",
        icon: "image",
      },
      {
        title: "Word to PDF",
        blurb:
          "Microsoft Word automation with a built-in converter fallback if Word is missing.",
        icon: "filePdf",
      },
      {
        title: "JPG / PNG to PDF",
        blurb: "Assemble images into a PDF from the dashboard.",
        icon: "files",
      },
      {
        title: "PDF to Images",
        blurb: "Render every page of a document as an image file.",
        icon: "image",
      },
      {
        title: "Extract Images",
        blurb:
          "Pull the actual embedded picture objects out of a PDF, validated against their declared pixel sizes.",
        icon: "image",
      },
      {
        title: "PDF to Excel",
        blurb:
          "A real .xlsx workbook built from the page's columns — verified by opening it in Excel, where cells read as numbers.",
        icon: "fileSpreadsheet",
      },
      {
        title: "Extract text",
        blurb: "Save any document's text as a .txt file, with page selection.",
        icon: "text",
      },
    ],
  },
  {
    id: "organise",
    title: "Organise pages",
    summary:
      "Assemble, rearrange and finish documents without a second tool.",
    color: "#f59e0b",
    items: [
      { title: "Merge", blurb: "Combine several PDFs into one document.", icon: "merge" },
      { title: "Split", blurb: "Break a document into separate files.", icon: "split" },
      { title: "Rotate", blurb: "Turn pages left or right in bulk.", icon: "rotate" },
      {
        title: "Delete & extract pages",
        blurb: "Remove what you don't need or pull selected pages into a new file.",
        icon: "pages",
      },
      {
        title: "Reorder, duplicate, insert",
        blurb:
          "Type a page order (or reverse it), duplicate pages, and insert blank pages at front, end or after any page.",
        icon: "reorder",
      },
      {
        title: "Crop and resize",
        blurb: "Trim edges or set a custom box; resize pages to A3/A4/A5/Letter/Legal.",
        icon: "crop",
      },
      {
        title: "Remove blank pages",
        blurb:
          "A page must have no text, no images and no drawings before it is called blank — sparse pages are kept.",
        icon: "broom",
      },
      {
        title: "Numbers, watermark, details",
        blurb:
          "Configurable page numbers, repeated diagonal watermarks, and title/author/subject/keywords written into the file.",
        icon: "stamp",
      },
      {
        title: "Greyscale, flatten, repair",
        blurb: "Convert colour to greyscale, flatten form fields, and repair damaged PDFs.",
        icon: "wrench",
      },
    ],
  },
  {
    id: "compress",
    title: "Compression",
    summary:
      "Shrink documents and images — either pick a level or name the exact file size you need.",
    color: "#f97316",
    items: [
      {
        title: "Quick compression",
        blurb: "Low / Medium / High quality dials for PDFs.",
        icon: "compress",
      },
      {
        title: "Target file size",
        blurb:
          "Type the size in MB: up to seven passes run, each result validated, and an unreachable target is reported honestly.",
        icon: "target",
      },
      {
        title: "Image compressor",
        blurb:
          "JPG, JPEG, PNG, WEBP and TIFF — quick levels or a target size, with the result stating if resolution was reduced.",
        icon: "image",
      },
      {
        title: "Image Quality Enhancer (2x / 4K / 8K)",
        blurb:
          "Local denoise, contrast, sharpening and Lanczos upscale — labelled in the app as NOT an AI upscaler.",
        icon: "sparkles",
      },
    ],
  },
  {
    id: "secure",
    title: "Security tools",
    summary:
      "Protect what matters and remove what must not travel with the file.",
    color: "#ef4444",
    items: [
      {
        title: "Password protection",
        blurb: "Real AES-256 encryption; the saved file is proven to refuse a blank password.",
        icon: "lock",
      },
      {
        title: "Remove password",
        blurb: "Unlock a PDF when you supply the password; a wrong password is reported, never ignored.",
        icon: "key",
      },
      {
        title: "Permanent redaction",
        blurb:
          "Redacted characters are deleted from the file — they cannot be copied, searched or recovered (verified by re-reading the output).",
        icon: "redact",
      },
      {
        title: "Digitally signed files are refused",
        blurb:
          "Instead of silently invalidating a signature, the app refuses to modify digitally signed PDFs and says why.",
        icon: "badge",
      },
      {
        title: "Watermark",
        blurb: "Repeated diagonal text with colour, size, strength and page choice.",
        icon: "stamp",
      },
    ],
  },
  {
    id: "search",
    title: "Search & compare",
    summary:
      "Find anything in your library and see exactly how two versions differ.",
    color: "#06b6d4",
    items: [
      {
        title: "Full-text search",
        blurb:
          "Search file names and document content together, with the matching sentence shown and an “IN TEXT” badge.",
        icon: "search",
      },
      {
        title: "Compare documents",
        blurb:
          "One HTML report with a word-level text diff and a page-by-page picture comparison — differences painted red.",
        icon: "compare",
      },
    ],
  },
  {
    id: "batch",
    title: "Batch operations",
    summary: "Run the same job over up to 200 documents in one pass.",
    color: "#d946ef",
    items: [
      {
        title: "Seven batch operations",
        blurb: "Watermark, compress, rotate, page numbers, greyscale, remove-blank and resize.",
        icon: "layers",
      },
      {
        title: "CSV report and per-file outcomes",
        blurb:
          "Each document succeeds or fails on its own; the run writes a CSV with original and final sizes.",
        icon: "report",
      },
      {
        title: "Stop and retry",
        blurb:
          "Stop stops a batch between documents and a running OCR job between pages — a stopped job reports cancelled, never done — and one click retries only the documents that failed.",
        icon: "stop",
      },
    ],
  },
  {
    id: "print",
    title: "Print",
    summary: "Build a real print document, then hand it to Windows.",
    color: "#64748b",
    items: [
      {
        title: "Page ranges and N-up",
        blurb: "Ranges like “1,3,5” or “odd” / “last”, and 2/4/6/8/9 pages on one sheet with scaling.",
        icon: "printer",
      },
      {
        title: "Print view at true paper size",
        blurb: "Every sheet rendered at 200 DPI from the print document — A4 measures 209.9 × 297 mm on screen.",
        icon: "eye",
      },
      {
        title: "Send to printer or save as PDF",
        blurb: "Hands the file to the Windows print dialog (which can also save with “Microsoft Print to PDF”).",
        icon: "windows",
      },
    ],
  },
  {
    id: "ai",
    title: "Local document AI",
    summary:
      "Free analysis that runs on your computer and quotes the document instead of guessing.",
    color: "#a855f7",
    items: [
      {
        title: "PDF AI Assistant (local text analysis)",
        blurb:
          "Overview, summary, key points, extracted dates/amounts/references, and page-scoped questions answered with quoted sentences.",
        icon: "spark",
      },
      {
        title: "Nothing is invented",
        blurb:
          "Every sentence shown is re-read from the file and confirmed server-side before you see it — no network, no API key, no model.",
        icon: "badge",
      },
      {
        title: "PDF AI Analyst",
        blurb:
          "Classifies documents, runs OCR on scans automatically, produces A-X cited analysis and exports to Word, Excel or PowerPoint.",
        icon: "report",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    summary: "Local-first by design, with the operational pieces teams need.",
    color: "#ec4899",
    items: [
      {
        title: "100% offline",
        blurb:
          "The server binds 127.0.0.1 only; no telemetry, no analytics, no external HTTP calls exist in the code.",
        icon: "offline",
      },
      {
        title: "Optional multi-user",
        blurb:
          "Sign-in is off by default; switch it on for ADMIN/USER accounts with per-tool permissions and PBKDF2-hashed passwords.",
        icon: "users",
      },
      {
        title: "Health check / self-test",
        blurb:
          "20+ checks that each execute a real operation — OCR, conversions, encryption — with an exportable diagnostic report.",
        icon: "heart",
      },
      {
        title: "Light and dark themes",
        blurb: "A theme switch with measured contrast ratios on both backgrounds.",
        icon: "palette",
      },
    ],
  },
];

/** Flat list used for counts and the features hero. */
export const FEATURE_COUNT = FEATURE_GROUPS.reduce(
  (n, g) => n + g.items.length,
  0,
);
