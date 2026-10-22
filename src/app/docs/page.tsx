import Link from "next/link";
import { DOCS_NAV, SITE } from "@/data/site";
import { Note, Badge } from "@/components/ui";
import { Icon } from "@/components/icons";

const BLURBS: Record<string, string> = {
  "/docs/": "Start here — what this documentation covers and how it was verified.",
  "/docs/installation/": "Requirements, installer, portable package, first run, update and uninstall.",
  "/docs/ocr-guide/": "Searchable vs editable OCR, what each preserves, and what can go wrong.",
  "/docs/conversion-guide/": "Word, Excel, images: what each converter really does and how to check results.",
  "/docs/troubleshooting/": "Startup failures, antivirus interference, ports, OCR problems, health check.",
  "/docs/faq/": "The questions people actually ask before downloading.",
  "/docs/release-notes/": "Version 1.7.0 and the history behind it, straight from the changelog.",
  "/docs/contact/": "How to ask for help and exactly what to include.",
  "/docs/privacy/": "What the application does with data — read from the code.",
  "/docs/terms/": "Terms of use for this website and the software.",
};

export default function DocsHomePage() {
  return (
    <article className="prose-page max-w-3xl">
      <Badge tone="gray">Version {SITE.version}</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
        Documentation
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Everything here is written against the shipped build — the same one the {SITE.gateSuites}-suite
        regression gate exercises ({SITE.gateResult}, run {SITE.gateRunOn}). Where something is not verified,
        the page says so instead of guessing — including{" "}
        <Link href="/docs/release-notes/#gate" className="font-semibold text-zinc-700 underline underline-offset-4 dark:text-zinc-200">
          what that gate caught and what was changed because of it
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {DOCS_NAV.filter((n) => n.href !== "/docs/").map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="card block p-5 no-underline! transition"
          >
            <h2 className="m-0 text-base font-bold text-zinc-950 dark:text-white">{n.label}</h2>
            <p className="mb-0 mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">{BLURBS[n.href] ?? ""}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-brand dark:text-[#ff6b6b]">Open →</span>
          </Link>
        ))}
      </div>

      <h2>Quick start</h2>
      <ol>
        <li>
          Download the installer (or the self-contained Professional package) from the{" "}
          <Link href="/download/">Download Center</Link> and check its SHA-256 if you want to be thorough.
        </li>
        <li>
          Install or extract — see the <Link href="/docs/installation/">installation guide</Link>. No Python, no
          internet, no administrator rights.
        </li>
        <li>Open Health check in the app's sidebar and run the full test — every line is a real operation.</li>
        <li>Drop a PDF on the dashboard and pick a job.</li>
      </ol>

      <h2>What this documentation will never do</h2>
      <div className="not-prose my-4">
        <Note icon="alert" title="No invented capabilities">
          If a feature, limit or date is not stated here, it is because it could not be confirmed in the project
          files — not because the page was lazy. Ask on the contact page and we will tell you what is actually known.
        </Note>
      </div>

      <h2>Verification record</h2>
      <table>
        <tbody>
          <tr>
            <th>Version</th>
            <td>{SITE.version} (release {SITE.releaseDate})</td>
          </tr>
          <tr>
            <th>Regression gate</th>
            <td>
              {SITE.gateSuites} suites · {SITE.gateResult} · executed {SITE.verifiedOn}
            </td>
          </tr>
          <tr>
            <th>Shipped test report</th>
            <td>
              {SITE.shippedReportSuites} suites, {SITE.shippedReportChecks.toLocaleString("en-US")} declared checks
              (TEST-REPORT.md, 2026-10-05)
            </td>
          </tr>
          <tr>
            <th>In-app self-test</th>
            <td>Health check: PASS 20 FAIL 0</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
