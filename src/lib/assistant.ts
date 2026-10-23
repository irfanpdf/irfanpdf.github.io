// Site-assistant knowledge engine. Every reply is assembled from this site's
// own data (src/data/*) and docs content — nothing here is invented, and
// nothing is fetched: the whole match runs in the visitor's browser.
//
// Matching is deterministic keyword scoring, NOT a language model:
//  - input and patterns are normalised (lowercase, punctuation -> spaces,
//    dots kept so "1.7.0" / "127.0.0.1" survive as single tokens)
//  - a pattern scores when it appears as a whole phrase (word-bounded)
//  - multi-word phrases score more than single words
//  - the best-scoring entry wins (ties -> the earlier entry in ENTRIES)
//
// scripts/test-assistant.mjs transpiles this file and asserts the routing of
// a question set, the fallback behaviour and that every link points at a
// route this site actually serves.

import { SITE } from "@/data/site";
import { ARTIFACTS, WINDOWS_REQ } from "@/data/downloads";
import { FEATURE_COUNT } from "@/data/features";

export type AssistantLink = { label: string; href: string };

export type Entry = {
  id: string;
  /** Lowercase phrases to match against the normalised question. */
  patterns: string[];
  reply: string;
  link?: AssistantLink;
};

export const INTRO: { text: string; link: AssistantLink } = {
  text:
    "Hello — I'm the Irfan PDF site assistant. I answer questions about Irfan PDF from this site's documentation, right in your browser. What would you like to know?",
  link: { label: "Browse the documentation", href: "/docs/" },
};

export const FALLBACK = {
  text:
    "I don't have an answer for that — I only reply from this site's documentation, so I'd rather say so than guess. Try rephrasing, pick one of the suggestions below, or browse the docs.",
  link: { label: "Documentation home", href: "/docs/" },
};

export const DISCLAIMER =
  "Replies come from this site's docs. Nothing you type leaves the page.";

/** Tappable starter questions (must each route to the expected entry). */
export const SUGGESTIONS: string[] = [
  "Is it free?",
  "Does it work offline?",
  "What are the system requirements?",
  "Which package should I download?",
  "Which languages does OCR read?",
  "How do I install it?",
];

const INSTALLER = ARTIFACTS.find((a) => a.recommended);
const PACKAGE_LIST = ARTIFACTS.map((a) => `${a.filename} (${a.mib})`).join(", ");

export const ENTRIES: Entry[] = [
  {
    id: "greeting",
    patterns: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "salam",
      "assalam",
      "how are you",
    ],
    reply:
      "Hello! Ask me anything about Irfan PDF — downloads, installation, OCR, conversions, privacy or troubleshooting — and I'll answer from this site's documentation.",
  },
  {
    id: "thanks",
    patterns: ["thanks", "thank you", "thx", "appreciate it", "jazakallah"],
    reply:
      "You're welcome! Ask me anything else about Irfan PDF — I reply straight from this site's documentation.",
  },
  {
    id: "identity",
    patterns: [
      "who are you",
      "what are you",
      "are you ai",
      "are you an ai",
      "are you a bot",
      "are you chatgpt",
      "chatbot",
      "chat bot",
      "artificial intelligence",
      "is this ai",
      "are you human",
      "real person",
      "real ai",
      "artificial",
      "language model",
      "are you a real",
      "how do you work",
      "what do you know",
    ],
    reply:
      "I'm the built-in site assistant for Irfan PDF: I match what you type against this site's documentation and reply from it, entirely in your browser. I'm not a large language model, I don't call any service, and nothing you type leaves this page.",
    link: { label: "What the documentation covers", href: "/docs/" },
  },
  {
    id: "what-is",
    patterns: [
      "what is irfan pdf",
      "what is this app",
      "what is this software",
      "what does it do",
      "tell me about",
      "about irfan pdf",
      "product overview",
      "introduce",
    ],
    reply:
      `Irfan PDF is a free Windows desktop application for viewing, editing, converting, OCR-ing, searching, comparing, printing and securing PDF documents — all offline on your own computer. Current version: ${SITE.version}.`,
    link: { label: "See all features", href: "/features/" },
  },
  {
    id: "free",
    patterns: [
      "is it free",
      "is this free",
      "free",
      "price",
      "pricing",
      "how much does it cost",
      "how much",
      "cost",
      "paid",
      "payment",
      "subscription",
      "licence",
      "license",
      "trial",
    ],
    reply:
      "Yes — it's free: no payment, subscription or licensing code exists anywhere in the project files. One honest caveat: the licensing terms themselves cannot be verified from the files (there is no LICENSE file); the README states only \u201cOriginal code and design built for this project\u201d.",
    link: { label: "Terms of use", href: "/docs/terms/" },
  },
  {
    id: "privacy",
    patterns: [
      "privacy",
      "upload",
      "uploaded",
      "uploads",
      "get uploaded",
      "uploaded anywhere",
      "documents get uploaded",
      "leave my computer",
      "leave this computer",
      "sent to a server",
      "telemetry",
      "tracking",
      "analytics",
      "my data",
      "documents leave",
      "send my",
      "127.0.0.1",
      "cloud service",
      "data collection",
    ],
    reply:
      "No. The application is a local Windows program whose server binds to 127.0.0.1 only, and a grep across the code on 2026-10-16 found no HTTP client, no telemetry and no analytics. Documents, thumbnails, drafts and settings stay in the local data folder.",
    link: { label: "Privacy policy", href: "/docs/privacy/" },
  },
  {
    id: "offline",
    patterns: [
      "offline",
      "internet",
      "internet connection",
      "online account",
      "need an account",
      "no account",
      "sign up",
      "need python",
      "do i need python",
      "without internet",
    ],
    reply:
      "Neither Python nor an internet connection is needed. Recognition, conversion, search, the assistant and printing all run on your machine with local models and libraries — no account, no cloud service, no internet. Only a source checkout needs Python 3.10+ and one pip install.",
    link: { label: "FAQ: Python & internet", href: "/docs/faq/" },
  },
  {
    id: "requirements",
    patterns: [
      "system requirements",
      "requirements",
      "windows 10",
      "windows 11",
      "64-bit",
      "32-bit",
      "disk space",
      "how much space",
      "administrator rights",
      "compatible with",
      "minimum",
    ],
    reply:
      `Requirements: ${WINDOWS_REQ}. Disk space: about 400 MB. The installer is a per-user install, so no administrator rights are required — and nothing else is needed alongside it (no Python, no pip, no internet).`,
    link: { label: "Installation guide", href: "/docs/installation/" },
  },
  {
    id: "download",
    patterns: [
      "download",
      "download link",
      "which package",
      "which file",
      "installer or portable",
      "portable vs",
      "the zip",
      "the exe",
      "get the app",
      "packages",
      "how big",
      "file size",
      "how large",
      "free download",
    ],
    reply:
      `Three packages are on the Download Center: ${PACKAGE_LIST}. The ${INSTALLER ? INSTALLER.filename : "installer"} is the recommended one; the small source ZIP needs your own Python 3.10+. Every package is listed with its SHA-256.`,
    link: { label: "Download Center", href: "/download/" },
  },
  {
    id: "checksum",
    patterns: [
      "checksum",
      "sha256",
      "sha-256",
      "sha 256",
      "hash",
      "verify the download",
      "verify the file",
      "authenticode",
      "code signing",
      "not signed",
      "smartscreen",
      "smartscreen warning",
      "antivirus",
      "antivirus warning",
      "virus warning",
    ],
    reply:
      "Every package on the Download Center is listed with its SHA-256 (measured 2026-10-22). The installer is not Authenticode-signed, so Windows may show a warning even for the genuine file — comparing the hash is how you confirm it.",
    link: { label: "Checksums on the Download Center", href: "/download/" },
  },
  {
    id: "install-steps",
    patterns: [
      "install",
      "installation",
      "how do i set it up",
      "first run",
      "health check",
      "self test",
      "self-test",
      "run full test",
      "getting started",
      "quick start",
    ],
    reply:
      `Two options: run ${INSTALLER ? INSTALLER.filename : "the installer"} (no admin rights, optional desktop shortcut and .pdf association), or extract IRFAN-PDF-PROFESSIONAL.zip in full and run START-APPLICATION.bat. On first run, open Health check and press Run full test — the recorded result for this build is PASS 20 / FAIL 0.`,
    link: { label: "Step-by-step installation", href: "/docs/installation/" },
  },
  {
    id: "update",
    patterns: [
      "update",
      "updates",
      "upgrade",
      "new version",
      "auto-update",
      "auto update",
      "updater",
      "will it update",
    ],
    reply:
      "There is no in-app updater — nothing updates itself. Update manually: download the newer package from the Download Center, run the installer over the previous one (or replace the portable folder), then run Health check → Run full test. Your documents stay in the data folder.",
    link: { label: "How updating works", href: "/docs/installation/#updating" },
  },
  {
    id: "uninstall",
    patterns: [
      "uninstall",
      "remove the app",
      "remove the program",
      "delete the app",
      "clean uninstall",
    ],
    reply:
      "Close the app, then uninstall from Windows (Settings → Apps → Irfan PDF) or the Start Menu's \u201cUninstall Irfan PDF\u201d entry; for the portable package, delete the IRFAN-PDF folder. Back up the data folder first — your documents are deliberately left in place.",
    link: { label: "Uninstalling", href: "/docs/installation/#uninstalling" },
  },
  {
    id: "data-location",
    patterns: [
      "where are my files",
      "where are my documents",
      "my documents",
      "data folder",
      "back up",
      "backup",
      "move to another pc",
      "another computer",
      "restore",
    ],
    reply:
      "Everything lives in a data folder next to the app: documents in Application\\data\\files, plus backups, logs and settings. Paths are relative, so copying the whole IRFAN-PDF folder is how you back it up or move it to another PC.",
    link: { label: "Where data lives", href: "/docs/installation/" },
  },
  {
    id: "ocr-languages",
    patterns: [
      "ocr languages",
      "which languages",
      "what languages",
      "language",
      "languages",
      "english only",
      "hindi",
      "urdu",
      "arabic",
      "chinese",
      "spanish",
      "french",
      "german",
      "multilingual",
    ],
    reply:
      "OCR ships with the English PP-OCRv5 model only. An \u201cOCR language\u201d setting exists in the app, but recognition in any other language is Not Verified and no other model ships in the package.",
    link: { label: "OCR guide", href: "/docs/ocr-guide/" },
  },
  {
    id: "ocr-modes",
    patterns: [
      "searchable ocr",
      "editable ocr",
      "difference between",
      "what is the difference",
      "ocr modes",
      "text layer",
      "change how my document",
      "change how it looks",
      "ocr difference",
    ],
    reply:
      "Searchable OCR adds an invisible text layer — the page still looks exactly like the scan, but the words become findable. Editable OCR replaces the printed glyphs with real text so you can correct words; layout may change. Both run fully offline.",
    link: { label: "Searchable vs editable OCR", href: "/docs/ocr-guide/" },
  },
  {
    id: "ocr-accuracy",
    patterns: [
      "accurate",
      "accuracy",
      "how good is ocr",
      "ocr errors",
      "ocr mistakes",
      "perfect ocr",
      "how reliable",
    ],
    reply:
      "Honest answer: no OCR system is perfect and this one doesn't claim to be. Recognition errors happen, especially on faint or badly skewed scans, and other scripts are Not Verified — check critical numbers, names and dates against the original page.",
    link: { label: "How accurate is OCR?", href: "/docs/faq/" },
  },
  {
    id: "ocr-general",
    patterns: [
      "ocr",
      "scan a document",
      "scanned document",
      "image to text",
      "recognise text",
      "recognize text",
      "make searchable",
      "photo of text",
    ],
    reply:
      "OCR turns scans and photos into text you can search and select — RapidOCR on ONNX Runtime with bundled models, fully offline: no Tesseract install, no internet, no API keys. Two modes: Searchable (invisible text layer) and Editable (real text you can fix).",
    link: { label: "OCR guide", href: "/docs/ocr-guide/" },
  },
  {
    id: "convert",
    patterns: [
      "convert",
      "conversion",
      "pdf to word",
      "word to pdf",
      "pdf to excel",
      "docx",
      "xlsx",
      "to word",
      "to excel",
      "extract text",
      "extract images",
      "jpg to pdf",
      "png to pdf",
      "pdf to images",
      "make a docx",
      "to docx",
      "into word",
      "into excel",
    ],
    reply:
      "Conversions include PDF↔Word, Word→PDF, PDF→Excel, images→PDF, PDF→images, extract text and extract images. Each output is validated before success is reported — the Excel build, for one, is opened in real Excel and must read cells as numbers, not text.",
    link: { label: "Conversion guide", href: "/docs/conversion-guide/" },
  },
  {
    id: "signed",
    patterns: [
      "digitally signed",
      "digital signature",
      "signed pdf",
      "signature is invalidated",
      "certificate",
      "what happens to signed",
    ],
    reply:
      "Digitally signed PDFs are refused, not modified: adding or changing anything would invalidate the signature, so the app explains that and writes nothing (verified in the regression gate, test_document_integrity 52/52).",
    link: { label: "Signed PDFs in the FAQ", href: "/docs/faq/" },
  },
  {
    id: "encrypted",
    patterns: [
      "password protected",
      "password-protected",
      "encrypted pdf",
      "encrypted",
      "locked pdf",
      "locked file",
      "unlock",
      "remove password",
      "forgot password",
      "open without password",
    ],
    reply:
      "Encrypted PDFs are refused with a message that names the fix. If you know the password, Remove password produces a fully working copy (a wrong password is reported, never ignored) and the locked file shows a LOCKED badge in the library. Opening a file you don't have the password for is not implemented.",
    link: { label: "Encrypted PDFs in the FAQ", href: "/docs/faq/" },
  },
  {
    id: "protect",
    patterns: [
      "password protect",
      "protect pdf",
      "encrypt",
      "encryption",
      "aes-256",
      "aes 256",
      "redact",
      "redaction",
      "watermark",
      "secure pdf",
      "security tools",
      "how secure",
      "is it secure",
      "is it safe",
    ],
    reply:
      "Security tools: password protection with real AES-256 (the saved file provably refuses a blank password), Remove password, permanent redaction — redacted characters are deleted from the file, so they can't be copied, searched or recovered — and watermarks. Digitally signed files are refused rather than silently invalidated.",
    link: { label: "Security page", href: "/security/" },
  },
  {
    id: "mobile",
    patterns: [
      "mobile app",
      "mobile version",
      "phone",
      "android",
      "ios",
      "app store",
      "web version",
      "browser version",
      "online version",
      "macos",
      "mac version",
      "linux",
      "chromebook",
    ],
    reply:
      "No mobile, web, Mac or Linux version exists. Irfan PDF is a Windows desktop application for Windows 10 (1809 or newer) or Windows 11, 64-bit — no cloud service, no sync, no hosted web version.",
    link: { label: "Platforms in the FAQ", href: "/docs/faq/" },
  },
  {
    id: "features",
    patterns: [
      "features",
      "what can it do",
      "capabilities",
      "tools",
      "functions",
      "does it support",
      "can it",
      "feature list",
      "can i edit",
      "edit text",
      "editing text",
      "edit a pdf",
      "change text in",
    ],
    reply:
      `${FEATURE_COUNT} verified features: PDF viewing, editing with font preservation, OCR, conversions, page organisation, compression, security tools, search & compare, batch operations, printing, local document AI and platform tools — each one exercised by the regression suite.`,
    link: { label: "All features", href: "/features/" },
  },
  {
    id: "app-ai",
    patterns: [
      "pdf ai",
      "ai assistant",
      "ai analyst",
      "document ai",
      "analyst",
      "summarise",
      "summarize",
      "summary of the document",
      "key points",
      "ask questions about",
      "does it have ai",
      "built in ai",
    ],
    reply:
      "The app's PDF AI Assistant runs entirely on your computer: overview, summary, key points, extracted dates and amounts, and page-scoped questions answered with quoted sentences re-read from the file — no network, no API key, no model. (That's inside the application; I'm the website's own helper.)",
    link: { label: "Local document AI features", href: "/features/" },
  },
  {
    id: "version",
    patterns: [
      "version",
      "release date",
      "when was it released",
      "changelog",
      "release notes",
      "latest release",
      "1.7.0",
      "what version",
      "history",
    ],
    reply:
      `Current version ${SITE.version}, released ${SITE.releaseDate} (CHANGELOG: \u201c1.7.0 final build - 2026-10-11\u201d). The packages on the Download Center were rebuilt and re-verified on ${SITE.packageDate}.`,
    link: { label: "Release notes", href: "/docs/release-notes/" },
  },
  {
    id: "testing",
    patterns: [
      "tested",
      "verified",
      "verification",
      "test report",
      "regression",
      "regression gate",
      "stable",
      "bugs",
      "bug free",
      "quality",
      "reliable",
      "trustworthy",
    ],
    reply:
      `The latest full regression gate (${SITE.gateRunOn}) passed ${SITE.gateSuitesPassed}/${SITE.gateSuites} suites with 0 failures; the shipped test report covers ${SITE.shippedReportSuites} suites / ${SITE.shippedReportChecks} checks, and each package on the Download Center was run again on ${SITE.packageDate} (self-test PASS 20 / FAIL 0).`,
    link: { label: "The regression gate, explained", href: "/docs/release-notes/#gate" },
  },
  {
    id: "compare",
    patterns: [
      "compare",
      "comparison",
      "diff two",
      "difference between two",
      "two versions",
      "changes between",
      "what changed",
    ],
    reply:
      "Compare produces one HTML report: a word-level text diff plus a page-by-page picture comparison, with differences painted red — so you can see exactly how two versions of a document differ.",
    link: { label: "Compare page", href: "/compare/" },
  },
  {
    id: "batch",
    patterns: [
      "batch",
      "many files",
      "multiple files",
      "bulk",
      "at once",
      "all my pdfs",
      "csv report",
      "200 documents",
    ],
    reply:
      "Batch runs one operation over up to 200 documents — watermark, compress, rotate, page numbers, greyscale, remove-blank, resize — with per-file outcomes and a CSV report. Stop stops between documents (a stopped job reports cancelled, never done), and one click retries only the failures.",
    link: { label: "Batch features", href: "/features/" },
  },
  {
    id: "print",
    patterns: [
      "print",
      "printing",
      "printer",
      "n-up",
      "page ranges",
      "paper size",
      "print to pdf",
    ],
    reply:
      "Build a print document with page ranges (like \u201c1,3,5\u201d or \u201codd\u201d) and 2/4/6/8/9 pages per sheet, preview it at true paper size (rendered at 200 DPI), then hand it to the Windows print dialog — which can also save with \u201cMicrosoft Print to PDF\u201d.",
    link: { label: "Print features", href: "/features/" },
  },
  {
    id: "compress",
    patterns: [
      "compress",
      "compression",
      "make smaller",
      "reduce size",
      "target size",
      "file too big",
      "shrink",
      "quality enhancer",
      "upscale",
    ],
    reply:
      "Compression offers Low/Medium/High quality dials or a target size in MB: up to seven passes run, each result validated, and an unreachable target is reported honestly. The image compressor handles JPG, JPEG, PNG, WEBP and TIFF.",
    link: { label: "Compression features", href: "/features/" },
  },
  {
    id: "multiuser",
    patterns: [
      "multi user",
      "multi-user",
      "user accounts",
      "admin account",
      "admin user",
      "sign in",
      "login",
      "permissions",
      "password for the app",
    ],
    reply:
      "Multi-user is optional and off by default. Switch it on for ADMIN/USER accounts with per-tool permissions and PBKDF2-hashed passwords — it runs entirely locally like everything else.",
    link: { label: "Platform features", href: "/features/" },
  },
  {
    id: "source",
    patterns: [
      "source code",
      "open source",
      "github",
      "repository",
      "from source",
      "source checkout",
      "requirements txt",
      "pip install",
    ],
    reply:
      "IrfanPDF_Portable.zip (7.3 MiB) is the application sources: 78 files, no bundled Python, so it needs your own Python 3.10+ and one pip install -r requirements.txt. For a normal install use the installer or the Professional package instead.",
    link: { label: "Source package details", href: "/download/" },
  },
  {
    id: "troubleshooting",
    patterns: [
      "not working",
      "does not work",
      "wont start",
      "won't start",
      "cannot open",
      "can't open",
      "error",
      "crash",
      "crashes",
      "crashing",
      "freeze",
      "freezing",
      "frozen",
      "hang",
      "hangs",
      "hanging",
      "stopped working",
      "not responding",
      "problem",
      "port already in use",
      "troubleshoot",
      "fix it",
      "broken",
      "help me",
    ],
    reply:
      "Start with Health check → Run full test, then the troubleshooting page — it has a symptom table covering nothing starts, the window won't open, SmartScreen/antivirus warnings, port already in use, OCR problems and PDF association issues.",
    link: { label: "Troubleshooting", href: "/docs/troubleshooting/" },
  },
  {
    id: "contact",
    patterns: [
      "contact",
      "support",
      "support email",
      "email you",
      "phone number",
      "forum",
      "report a bug",
      "feedback",
      "reach you",
      "customer service",
    ],
    reply:
      "No support channel (email, forum or issue tracker) is published in the project files — so there's no address to write to yet. The contact page says exactly what a request should contain once a channel exists, and the troubleshooting page is the place to start meanwhile.",
    link: { label: "Contact & support", href: "/docs/contact/" },
  },
];

const PUNCT_TO_SPACE = /[^a-z0-9.]+/g;

/** Lowercase, punctuation -> spaces, dots kept (1.7.0, 127.0.0.1), collapsed. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(PUNCT_TO_SPACE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pad so patterns match on token boundaries ("free" not "freely"). */
function pad(s: string): string {
  return ` ${s} `;
}

function patternScore(normalizedInput: string, pattern: string): number {
  const p = normalize(pattern);
  if (!p) return 0;
  const haystack = pad(normalizedInput);
  const needle = pad(p);
  if (!haystack.includes(needle)) return 0;
  const words = p.split(" ").length;
  // multi-word phrases are far more specific than single words
  let score = words >= 2 ? 3 : 1;
  if (normalizedInput === p) score += 2;
  return score;
}

/** Best-scoring entry, or null when nothing clears the threshold. */
export function matchEntry(question: string): Entry | null {
  const input = normalize(question);
  if (!input) return null;

  let best: Entry | null = null;
  let bestScore = 0;

  for (const entry of ENTRIES) {
    let score = 0;
    for (const p of entry.patterns) score += patternScore(input, p);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= 1 ? best : null;
}

export type Answer = { reply: string; link?: AssistantLink };

/** Final user-facing behaviour: matched reply or the honest fallback. */
export function answerFor(question: string): Answer {
  const entry = matchEntry(question);
  if (entry) return { reply: entry.reply, link: entry.link };
  return { reply: FALLBACK.text, link: FALLBACK.link };
}
