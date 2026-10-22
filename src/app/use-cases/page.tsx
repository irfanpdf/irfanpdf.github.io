import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { PageHero, Section, Badge } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export const metadata: Metadata = {
  ...canonicalFor("/use-cases"),
  title: "Use cases",
  description:
    "Who Irfan PDF is for: office work, study, accounting, compliance, document teams and IT administration — each mapped to verified capabilities.",
};

type Case = {
  title: string;
  icon: IconName;
  color: string;
  who: string;
  jobs: { job: string; feature: string }[];
  testimonialStyle: string;
};

const CASES: Case[] = [
  {
    title: "Office workers",
    icon: "users",
    color: "#8b5cf6",
    who: "Anyone who touches contracts, letters and forms daily",
    jobs: [
      { job: "Fix a typo in a signed-off PDF", feature: "Edit existing text (font preserved)" },
      { job: "Add a signature and today's date", feature: "Signatures: draw, upload or type" },
      { job: "Combine a packet before sending", feature: "Merge" },
      { job: "Lay 4 pages per sheet for a handout", feature: "Print — N-up with true paper size" },
    ],
    testimonialStyle: "Edit → Save → Print, without ever exporting to another tool.",
  },
  {
    title: "Students",
    icon: "text",
    color: "#10b981",
    who: "Reading scans, handouts and paper chapters",
    jobs: [
      { job: "Search a scanned chapter for a quote", feature: "Searchable OCR + full-text search" },
      { job: "Pull passages into an essay draft", feature: "OCR editable, then copy or save .txt" },
      { job: "Turn phone photos of notes into Word", feature: "Image to Word" },
      { job: "Shrink a 200-page reader before sharing", feature: "Compress with target size" },
    ],
    testimonialStyle: "Paper becomes searchable text you can quote exactly.",
  },
  {
    title: "Accountants & finance teams",
    icon: "fileSpreadsheet",
    color: "#f59e0b",
    who: "Statements, invoices and ledgers",
    jobs: [
      { job: "Get a statement's table into a spreadsheet", feature: "PDF to Excel (.xlsx, cells read as numbers)" },
      { job: "Find every amount across the library", feature: "Full-text search with snippets" },
      { job: "Compress a quarter of scans to a size limit", feature: "Target-size compression (7 measured passes)" },
      { job: "Keep working on a plane", feature: "100% offline — no connection needed" },
    ],
    testimonialStyle: "Numbers arrive as numbers, and the app proves it opened them.",
  },
  {
    title: "Compliance, legal & HR",
    icon: "shield",
    color: "#ef4444",
    who: "Documents that must not leak",
    jobs: [
      { job: "Remove a person's details permanently", feature: "Redaction — characters deleted, not painted over" },
      { job: "Lock a file before it circulates", feature: "Password protection (AES-256)" },
      { job: "See what changed between revisions", feature: "Compare — word diff + page pictures in one report" },
      { job: "Never invalidate a digital signature by accident", feature: "Digitally signed PDFs are refused, with the reason" },
    ],
    testimonialStyle: "Everything stays on the machine — nothing to subpoena from a cloud.",
  },
  {
    title: "Document processing teams",
    icon: "layers",
    color: "#d946ef",
    who: "Recurring jobs over many files",
    jobs: [
      { job: "Watermark / rotate / number 200 files", feature: "Batch operations (7 jobs, CSV report)" },
      { job: "Know exactly which files failed", feature: "Per-file outcomes + retry-only-failed" },
      { job: "Stop a run that went wrong", feature: "Stop honoured between documents and between OCR pages" },
      { job: "Standardise A4 / Letter output", feature: "Batch resize (A3/A4/A5/Letter/Legal)" },
    ],
    testimonialStyle: "One pass, one CSV, honest per-file results.",
  },
  {
    title: "IT administrators",
    icon: "terminal",
    color: "#0ea5e9",
    who: "Deploying to managed Windows PCs",
    jobs: [
      { job: "Install without admin rights", feature: "Per-user Inno Setup installer (no elevation)" },
      { job: "Deploy a self-contained bundle", feature: "Professional ZIP with its own Python runtime" },
      { job: "Diagnose a user's machine remotely", feature: "Health check + exportable diagnostic report" },
      { job: "Enable sign-in for shared machines", feature: "Optional multi-user: roles, PBKDF2, rate limiting" },
    ],
    testimonialStyle: "No Python, no internet, no package manager on the target PC.",
  },
];

export default function UseCasesPage() {
  return (
    <>
      <PageHero
        eyebrow="Use cases"
        title="Mapped to features that exist"
        lede="Six kinds of work, each linked to capabilities the shipped build performs — with the tests that cover them."
      >
        <Link href="/features/" className="btn btn-primary">
          Explore features <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
        <Link href="/compare/" className="btn btn-ghost">
          Compare PDF tools
        </Link>
      </PageHero>

      <div className="container-page space-y-8 py-12">
        {CASES.map((c, i) => (
          <section
            key={c.title}
            aria-labelledby={`case-${i}`}
            className={`card overflow-hidden ${i % 2 === 1 ? "" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: c.color }}
                aria-hidden="true"
              >
                <Icon name={c.icon} className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <h2 id={`case-${i}`} className="text-xl font-extrabold text-zinc-950 dark:text-white">
                  {c.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.who}</p>
              </div>
              <Badge tone="gray">
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> verified capability
              </Badge>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.4fr_1fr]">
              <ul className="space-y-3">
                {c.jobs.map((j) => (
                  <li key={j.job} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{j.job}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">→ {j.feature}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-[#161926]">
                <p className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  In practice
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{c.testimonialStyle}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <Section>
        <div className="rounded-3xl bg-zinc-950 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-extrabold md:text-3xl">Same tool, every document type</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
            Nothing above is a mock-up workflow: each line names a shipped capability with a regression test behind it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/download/" className="btn btn-brand">
              <Icon name="download" className="h-5 w-5" /> Download for Windows
            </Link>
            <Link href="/how-it-works/" className="btn btn-ghost !border-zinc-700 !text-white hover:!bg-zinc-900">
              See the workflows
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
