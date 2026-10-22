import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note, CheckList } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/contact"),
  title: "Contact & support",
  description:
    "How to ask for help with Irfan PDF: what to include (health report, logs, reproduction steps, Windows and app version) and the honest status of support channels.",
};

export default function ContactPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
        Contact &amp; support
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Before anything else, the honest status — stated plainly because a contact page that invents an address
        is worse than one that admits it has none.
      </p>

      <div className="not-prose my-4">
        <Note icon="alert" title="No support channel is published" tone="amber">
          No email address, forum, chat, social account or issue tracker for Irfan PDF appears in any project
          file — <strong>Cannot verify from project files</strong>. This site is static and carries no contact
          form. Nothing on this page is a way to reach anyone today; it is the preparation for when a channel
          is published.
        </Note>
      </div>

      <h2>What to put together first</h2>
      <p>
        A request that arrives with these five things can be diagnosed without a single follow-up question.
        This is exactly what the shipped installation guide says to send when asking for help.
      </p>
      <CheckList
        items={[
          "Health check result: run Health check → Run full test, then press Export diagnostic report and keep the file. From the portable package, RUN-HEALTH-CHECK.bat writes Health_Report.html instead.",
          "The log files from the app's data\\logs folder (the rotating log is named irfan-pdf.log). They contain job errors and tracebacks — that is usually where the answer is.",
          "The exact steps to reproduce: what you opened, which tool you pressed, what you expected, what happened instead, and the full text of any error message.",
          "Your Windows version and edition (Windows 10 1809 or newer, or Windows 11, 64-bit) — and whether the app was started from the installer or from the extracted portable folder.",
          "The app version: 1.7.0, as shown in the application's Settings / about information.",
        ]}
      />

      <div className="not-prose my-4">
        <Note icon="lock" title="What not to send" tone="red">
          Never send your sign-in password, and think twice before sending the document itself: share only what
          the recipient needs — usually the health report and the logs, not your files. If a document must be
          included, remove or redact personal data first and only send it to someone you trust. Nothing in this
          project ever asks for your files to be uploaded anywhere; keep it that way.
        </Note>
      </div>

      <h2>Fix it yourself first</h2>
      <p>
        Many reports are answered by the troubleshooting page before anyone is contacted:
      </p>
      <ul>
        <li>
          <strong>Ctrl+F5</strong> in the app window (or <strong>Ctrl+Shift+R</strong> in the browser) clears a
          stale interface after an update.
        </li>
        <li>
          Startup failures with a printed reason — a missing bundled runtime means an incomplete extraction;
          nothing happening at all usually means antivirus quarantined files. Full list on{" "}
          <Link href="/docs/troubleshooting/">Troubleshooting</Link>.
        </li>
        <li>
          Windows may warn because the installer is unsigned (Authenticode: NotSigned) — compare the SHA-256 on
          the <Link href="/download/">Download Center</Link> before assuming the file is bad.
        </li>
        <li>
          OCR questions — refused signed files, encrypted files, layout differences after editable OCR — are
          answered in the <Link href="/docs/ocr-guide/">OCR guide</Link> and the <Link href="/docs/faq/">FAQ</Link>
          .
        </li>
      </ul>

      <h2>How a request should be routed</h2>
      <p>
        It cannot be routed yet, and this page will not pretend otherwise:
      </p>
      <ul>
        <li>
          There is <strong>no contact form</strong> here — this is a static site with no backend to receive
          one, and inventing an endpoint or an address would be a false claim.
        </li>
        <li>
          When a channel (email, forum or issue tracker) is published, it belongs on this page with its exact
          address. Until this page shows one, treat any address claiming to be official as unofficial.
        </li>
        <li>
          The project also ships its test suite (<code>tests\</code>, 43 suites, all passing on the
        2026-10-17 gate run). Running{" "}
          <code>python run_regression.py</code> from that folder on the affected machine produces the same
          evidence a report needs — see <Link href="/docs/release-notes/">release notes</Link>.
        </li>
      </ul>

      <div className="not-prose my-4">
        <Note icon="info" title="Why the logs are enough">
          The application is local by design: it binds to 127.0.0.1, keeps its documents, backups, logs and
          settings in its own data folder, and makes no external calls. So a report needs what happened on
          <em> your</em> machine — the health report and the logs — not access to your files. Details in the{" "}
          <Link href="/docs/privacy/">privacy policy</Link>.
        </Note>
      </div>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/troubleshooting/">Troubleshooting</Link> · <Link href="/docs/faq/">FAQ</Link> ·{" "}
        <Link href="/docs/installation/">Installation</Link>
      </p>
    </article>
  );
}
