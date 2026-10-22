import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { PageHero, Section, Note, Badge, CheckList } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export const metadata: Metadata = {
  ...canonicalFor("/security"),
  title: "Security & privacy",
  description:
    "How Irfan PDF handles data: local-only processing, no telemetry, optional accounts with PBKDF2 hashing, request hardening, and how digitally signed documents are treated — all verified in code.",
};

const PILLARS: {
  icon: IconName;
  title: string;
  verified: string[];
  evidence: string;
}[] = [
  {
    icon: "globe",
    title: "Local processing",
    verified: [
      "Server binds to 127.0.0.1 only — never a public interface",
      "OCR runs on bundled ONNX models (RapidOCR), no cloud calls",
      "PDF processing is done by the bundled PyMuPDF runtime",
      "All data lives in the application's own data folder on disk",
    ],
    evidence: "server/config.py (HOST/PORT), grep: zero HTTP clients in server/ and web/js/",
  },
  {
    icon: "shield",
    title: "No internet, no telemetry",
    verified: [
      "No requests/httpx/urllib usage in the application code",
      "No telemetry, analytics, tag managers or crash reporters",
      "No account is required (sign-in is optional and off by default)",
      "Nothing is sent anywhere: the app works with the network cable out",
    ],
    evidence: "grep telemetry|analytics|sentry|gtag → no matches (2026-10-16)",
  },
  {
    icon: "lock",
    title: "Accounts & passwords (optional)",
    verified: [
      "Passwords stored as PBKDF2-HMAC-SHA256, 600 000 iterations, per-user salt",
      "Login rate limit: 5 failures per 5 minutes per IP",
      "Last administrator cannot be demoted or removed",
      "ADMIN / USER roles with per-tool permission masks",
      "Session bound to client identity, token forgery and replay tested",
    ],
    evidence: "_test_auth_users (71), CHANGELOG 1.6.0 / 1.7.0",
  },
  {
    icon: "cpu",
    title: "Request hardening",
    verified: [
      "DNS-rebinding Host check: only 127.0.0.1 / localhost / ::1 accepted",
      "Browser Origin checked on unsafe (POST) requests",
      "Cross-site POSTs refused (415 / 403) — even with a permissive CORS header",
      "512 MB request body ceiling; slow-loris timeouts and per-IP connection caps",
      "X-Content-Type-Options: nosniff, SAMEORIGIN frame, no-referrer policy",
      "No raw tracebacks or file paths in client-facing errors",
    ],
    evidence: "CHANGELOG 1.7.0 (8 + 4 findings), regression gate 2026-10-17",
  },
  {
    icon: "badge",
    title: "Document integrity",
    verified: [
      "Digitally signed PDFs are refused with an explanation, never silently modified",
      "Encrypted PDFs are refused with a named fix, not a dead end",
      "Saving over the original file is refused (409) — output is always a new file",
      "Redaction deletes characters permanently; the app re-reads the output to prove it",
    ],
    evidence: "regression gate 2026-10-17, test_security_pages (73), _test_password_pdf (23)",
  },
  {
    icon: "report",
    title: "Logging & diagnostics",
    verified: [
      "Operational logs stay in the local data folder",
      "Diagnostic report export exists for support — you choose when to share it",
      "No document content is uploaded for “improvement” purposes",
    ],
    evidence: "server code + README.md §7, INSTALLATION-GUIDE.md",
  },
];

const NOT_VERIFIED = [
  "An independent third-party security audit — no such report exists in the project files.",
  "Formal penetration-test results.",
  "A bug-bounty or vulnerability disclosure channel (none is published in the project).",
  "Code signing of the installer (Artifacts are Authenticode: NotSigned).",
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security & privacy"
        title="Determined from the code, not from marketing"
        lede="Every statement on this page was read out of the shipped source and test suites. Anything that could not be confirmed is listed as Not Verified at the bottom."
      >
        <Badge tone="green">
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> Verified in code
        </Badge>
        <Link href="/docs/privacy/" className="btn btn-ghost">
          Privacy policy
        </Link>
      </PageHero>

      <div className="container-page space-y-6 py-10">
        <Note icon="alert" title="Digitally signed documents">
          A digitally signed PDF is <strong>refused</strong> for OCR and export operations with a clear message.
          Adding a text layer would break the signature, so the app does not attempt it. This is a deliberate
          preservation behaviour, tested in the regression gate.
        </Note>
      </div>

      <div className="container-page grid gap-6 pb-12 md:grid-cols-2">
        {PILLARS.map((p) => (
          <section key={p.title} className="card p-6" aria-labelledby={`p-${p.title.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Icon name={p.icon} className="h-5 w-5" />
              </span>
              <h2 id={`p-${p.title.replace(/\s+/g, "-").toLowerCase()}`} className="text-lg font-extrabold text-zinc-950 dark:text-white">
                {p.title}
              </h2>
            </div>
            <div className="mt-4">
              <CheckList items={p.verified} />
            </div>
            <p className="mt-4 rounded-lg bg-zinc-100 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-600 dark:bg-[#161926] dark:text-zinc-400">
              Evidence: {p.evidence}
            </p>
          </section>
        ))}
      </div>

      <Section title="What is NOT verified" lede="Stated openly because a privacy page that hides gaps is not a privacy page.">
        <ul className="mx-auto max-w-3xl space-y-3">
          {NOT_VERIFIED.map((t) => (
            <li key={t} className="card flex items-start gap-3 p-4">
              <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <span className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{t}</span>
            </li>
          ))}
        </ul>
        <div className="mx-auto mt-8 max-w-3xl">
          <Note icon="info" title="Internet requirements">
            None. The application performs no network operations — not for OCR, not for updates, not for telemetry.
            The website you are reading is separate from the application and makes its own requests to serve these
            pages.
          </Note>
        </div>
      </Section>
    </>
  );
}
