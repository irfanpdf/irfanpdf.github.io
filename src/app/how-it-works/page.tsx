import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { PageHero, Section, Note, Badge } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export const metadata: Metadata = {
  ...canonicalFor("/how-it-works"),
  title: "How it works",
  description:
    "Step-by-step Irfan PDF workflows: install, OCR a scan, convert to Word or Excel, edit and save, organise pages, secure a document, and print.",
};

type Step = { title: string; text: string };
type Flow = {
  id: string;
  title: string;
  icon: IconName;
  color: string;
  steps: Step[];
  result: string;
  evidence: string;
};

const FLOWS: Flow[] = [
  {
    id: "install",
    title: "Install and first run",
    icon: "download",
    color: "#0ea5e9",
    steps: [
      { title: "Run the installer (or extract the ZIP)", text: "IrfanPDF_Setup_1.7.0.exe installs per-user with no administrator rights. The Professional ZIP needs only extraction — run START-APPLICATION\\START-APPLICATION.bat." },
      { title: "Launch from the shortcut", text: "The desktop window opens; if the native window cannot start, the same application opens in your default browser." },
      { title: "Run Health check first", text: "Open Health check in the sidebar and press “Run full test” — every line executes a real operation (OCR, conversions, encryption), not a library probe." },
      { title: "Start working", text: "Drop a PDF anywhere on the dashboard." },
    ],
    result: "A working installation you have already proven with the app's own self-test.",
    evidence: "test_health_check (23), installer script irfan_pdf.iss",
  },
  {
    id: "ocr",
    title: "Make a scan searchable or editable",
    icon: "scan",
    color: "#10b981",
    steps: [
      { title: "Open the file", text: "Scanned pages are rotated upright and straightened automatically at upload (skew up to 5° corrected)." },
      { title: "Choose OCR mode", text: "“Make searchable” keeps the original appearance with an invisible text layer. “Make editable” covers the glyphs and inserts real editable text at their original positions." },
      { title: "Run it", text: "Progress is per page; raw file IDs never leak into messages." },
      { title: "Check the result", text: "Text is now selectable and searchable. Spot-check numbers and names — no OCR system is perfect." },
    ],
    result: "A text layer you can search, select and correct — offline.",
    evidence: "_test_ocr_fidelity (19), _test_deskew (16), test_e2e (37)",
  },
  {
    id: "word",
    title: "Convert PDF → Word, Excel or images",
    icon: "fileWord",
    color: "#3b82f6",
    steps: [
      { title: "Pick the converter", text: "PDF to Word, PDF to Excel, PDF to Images, or Extract Images from the dashboard's Convert section." },
      { title: "Select pages (optional)", text: "Ranges like 1-3,5 are accepted wherever pages matter." },
      { title: "Run and wait", text: "Word conversion uses pdf2docx with Microsoft Word itself as an accuracy fallback when Word is installed." },
      { title: "Verify the output", text: "Extracted images are re-opened and their pixel dimensions validated; Excel files are opened and cells read back as numbers — before the app calls the job done." },
    ],
    result: "A .docx / .xlsx / image files that the app has already validated.",
    evidence: "test_e2e (37), _test_extract_tools (34)",
  },
  {
    id: "edit",
    title: "Edit and save without breaking the layout",
    icon: "pen",
    color: "#8b5cf6",
    steps: [
      { title: "Open the editor", text: "Thumbnail strip, zoom modes (whole page / fill width / actual size) and the object toolbar." },
      { title: "Click the content", text: "Edit existing text with font, size, colour, weight and alignment controls — the word is written back with the document's own embedded font." },
      { title: "Add what is missing", text: "Text boxes, images, drawn/uploaded/typed signatures, rectangles, ellipses, lines, arrows, highlights, free-hand." },
      { title: "Save", text: "Ctrl+S (or the Save button) writes the file; closing with unsaved changes keeps a restorable draft. Saving over the original is refused with 409." },
    ],
    result: "An edited PDF whose borders, tables and fonts still look original.",
    evidence: "_test_font_preserve (24), _test_style_edit (13), _test_edit_keeps_form (14)",
  },
  {
    id: "organise",
    title: "Organise, compress and finish pages",
    icon: "layers",
    color: "#f59e0b",
    steps: [
      { title: "Open the tool", text: "Merge, Split, Compress, Rotate, Crop, Resize, Page numbers, Watermark, Greyscale, Repair and friends live together on the tools page." },
      { title: "Set the options", text: "Every tool follows the same pattern: pick files → set options → run. The UI announces jobs through an ARIA live region." },
      { title: "Run", text: "For compression you can type an exact target size; up to seven passes run, each result measured, and an unreachable target is reported honestly." },
      { title: "Review the outcome card", text: "Size before/after, pages touched, warnings — the original file is never silently overwritten." },
    ],
    result: "Finished documents with proven numbers.",
    evidence: "_test_compress_target (22), test_security_pages (73), test_tool_wiring (55)",
  },
  {
    id: "secure",
    title: "Secure, redact, sign safely",
    icon: "shield",
    color: "#ef4444",
    steps: [
      { title: "Protect with a password", text: "Real AES-256 — the saved file is proven to refuse a blank password." },
      { title: "Redact what must disappear", text: "Redacted characters are deleted from the file itself; they cannot be copied or searched out of the result." },
      { title: "Leave signatures alone", text: "Digitally signed PDFs are refused with an explanation — adding a text layer would invalidate the signature." },
      { title: "Optional accounts", text: "If you switch sign-in on: ADMIN/USER roles, per-tool permissions, PBKDF2-hashed passwords, login rate limiting." },
    ],
    result: "Protected output, and documents you were never allowed to break.",
    evidence: "test_security_pages (73), _test_password_pdf (23), _test_auth_users (71)",
  },
  {
    id: "print",
    title: "Print with real page geometry",
    icon: "printer",
    color: "#64748b",
    steps: [
      { title: "Open Print", text: "Ranges like 1,3,5 or odd / last, and 2/4/6/8/9 pages per sheet with scaling." },
      { title: "Check Print view", text: "Every sheet is rendered at 200 DPI from the print document — A4 shows as 209.9 × 297 mm." },
      { title: "Hand over to Windows", text: "The file goes to the Windows print dialog; “Microsoft Print to PDF” can also save a copy." },
    ],
    result: "Paper (or a printed PDF) that matches the preview exactly.",
    evidence: "test_print (78), test_print_api (63)",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="Real workflows, straight from the code"
        lede="Each flow below is the behaviour the shipped application actually implements, with the test suite that proves it."
      >
        <Link href="/download/" className="btn btn-primary">
          <Icon name="download" className="h-5 w-5" /> Download for Windows
        </Link>
        <Link href="/docs/" className="btn btn-ghost">
          Read documentation
        </Link>
      </PageHero>

      <div className="container-page space-y-10 py-12">
        {FLOWS.map((f) => (
          <section key={f.id} id={f.id} aria-labelledby={`f-${f.id}`} className="card overflow-hidden">
            <header className="flex flex-wrap items-center gap-4 border-b border-zinc-200 bg-zinc-50 px-6 py-5 dark:border-zinc-800 dark:bg-[#161926]">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: f.color }}
                aria-hidden="true"
              >
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h2 id={`f-${f.id}`} className="text-xl font-extrabold text-zinc-950 dark:text-white">
                  {f.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Verified by: {f.evidence}</p>
              </div>
            </header>

            <div className="px-6 py-6">
              <ol className="space-y-5">
                {f.steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                      style={{ backgroundColor: f.color }}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-zinc-950 dark:text-white">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                <Badge tone="green">Result</Badge>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{f.result}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <Section>
        <Note icon="alert" title="No fictional workflows">
          Nothing on this page describes a capability that is absent from the build. If a step cannot be performed in
          the shipped application, it is not listed — see the Features page for the verified inventory and its honest
          limits.
        </Note>
      </Section>
    </>
  );
}
