import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note, CheckList } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/privacy"),
  title: "Privacy policy",
  description:
    "Privacy policy for Irfan PDF: the local-only Windows application (no telemetry, no cloud, local OCR) and this static website (no cookies, no analytics, one theme key).",
};

export default function PrivacyPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Privacy policy</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Two different things are described here: the Irfan PDF desktop application, and this website. Both are
        small on purpose. Everything stated below was read from the project files or from a code scan dated
        2026-10-16; where a claim could not be checked, the page says so.
      </p>

      <h2>A. The Irfan PDF application</h2>

      <h3>Nothing leaves your machine</h3>
      <ul>
        <li>
          The application&rsquo;s local server binds to <strong>127.0.0.1 only</strong> — reachable from this
          computer and from nothing else.
        </li>
        <li>
          A grep across the server and interface code on 2026-10-16 for HTTP clients, telemetry, analytics and
          error-reporting services returned <strong>zero matches</strong>: no telemetry, no analytics, no
          external HTTP calls.
        </li>
        <li>
          OCR, conversion, search, comparison and the document analysis tools all run locally with bundled
          models and libraries. The analysis module contains no API key, no URL and no network call — a test
          enforces that.
        </li>
        <li>
          The shipped test report records that <strong>no paid or network service is required</strong> by the
          software.
        </li>
      </ul>

      <h3>Where your data lives</h3>
      <p>
        Everything is stored in the application&rsquo;s own data folder, next to the program — never in a cloud
        and never in a user profile path:
      </p>
      <ul>
        <li>
          <code>data\files</code> — your documents and everything generated from them;
        </li>
        <li>
          <code>data\backups</code>, <code>data\state</code>, <code>data\models</code>,{" "}
          <code>data\output</code>, <code>data\jobs</code>, <code>data\temp</code>;
        </li>
        <li>
          <code>data\logs</code> — operational logs; <code>data\settings.json</code> — your preferences.
        </li>
      </ul>
      <p>
        Deleting that folder removes the data. Paths derive from the application folder and can be relocated
        with <code>IRFAN_PDF_HOME</code>.
      </p>

      <h3>Accounts (optional, off by default)</h3>
      <p>
        Sign-in starts switched off: there is no account to create, no email address collected, no cloud
        service. If several people share a machine, an administrator can switch sign-in on in Settings &rarr;
        People. Passwords are stored only as salted <strong>PBKDF2-HMAC-SHA256 with 600,000 iterations</strong>{" "}
        (the plaintext is never written anywhere), a wrong password and an unknown user return the same message,
        and sign-in is rate limited to five failures per username per five minutes. Switching sign-in off again
        keeps the accounts local.
      </p>

      <h3>Logging</h3>
      <div className="not-prose my-4">
        <Note icon="info" title="What the logs contain — and what was not audited">
          The application writes a rotating operational log to <code>data\logs\irfan-pdf.log</code> (5
          &times; 2 MB). The project states that job failures are logged with their tracebacks and that{" "}
          <strong>nothing logs document content</strong>. The exact field list of every log line and of the
          exported diagnostic report has <strong>not been independently audited for this page</strong> — Cannot
          verify beyond the project&rsquo;s own statement. Read a log before you share it.
        </Note>
      </div>

      <h3>No third parties, no automatic updates</h3>
      <ul>
        <li>
          The application talks to no third-party service: no analytics vendor, no CDN, no font or icon
          host — the interface ships with its own inline assets.
        </li>
        <li>
          <strong>There is no updater.</strong> Nothing in the project files downloads or installs a new
          version; updating is a manual download, as described in{" "}
          <Link href="/docs/installation/#updating">Installation</Link>.
        </li>
        <li>
          Local protections include a Host-header check against DNS rebinding, an Origin guard that refuses
          cross-site writes (403/415), a 512 MB request ceiling and <code>nosniff</code> /{" "}
          <code>SAMEORIGIN</code> / <code>no-referrer</code> headers.
        </li>
      </ul>

      <h2>B. This website</h2>
      <ul>
        <li>
          <strong>No cookies.</strong> The site sets none.
        </li>
        <li>
          <strong>No analytics and no third-party trackers</strong> — no tag manager, no pixel, no embedded
          third-party scripts. Fonts and icons are inline, so the pages load without contacting anyone.
        </li>
        <li>
          <strong>One localStorage entry:</strong> <code>ipdf-site-theme</code>, holding your light or dark
          choice. It stays in your browser, is not sent anywhere, and clearing site data removes it.
        </li>
        <li>
          <strong>When hosted:</strong> the web server&rsquo;s standard access logs apply — the usual record of
          IP address, requested page, time and user agent. Which provider hosts this site, and that
          provider&rsquo;s retention policy, <strong>Cannot verify from project files until the site is
          deployed</strong>.
        </li>
        <li>
          Download links are only produced from a configured base URL; no placeholder or third-party download
          host is ever substituted.
        </li>
      </ul>

      <h2>Data we never see</h2>
      <CheckList
        items={[
          "Your documents — their content, their names, the pages you open and the tools you run on them.",
          "Anything written inside them: names, addresses, account numbers, medical or legal details.",
          "Your application sign-in passwords — they are hashed locally and never transmitted.",
          "Your conversions, edits and searches — they happen on your machine and stay there.",
        ]}
      />

      <div className="not-prose my-4">
        <Note icon="shield" title="The one way data can leave your machine" tone="green">
          You send it yourself — by attaching a health report or a log to a support request, or by sharing a
          file you produced. The <Link href="/docs/contact/">contact page</Link> says what to include and what
          to withhold.
        </Note>
      </div>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/security/">Security</Link> · <Link href="/docs/terms/">Terms of use</Link> ·{" "}
        <Link href="/docs/faq/">FAQ</Link>
      </p>
    </article>
  );
}
