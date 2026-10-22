import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note, CheckList } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/troubleshooting"),
  title: "Troubleshooting",
  description:
    "Irfan PDF troubleshooting: nothing starts, antivirus or SmartScreen warnings, port conflicts, OCR problems, PDF association issues — and the health check to run first.",
};

export default function TroubleshootingPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Troubleshooting</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Start with the health check, not with a reinstall. Every item below is drawn from the installation
        guide, the shipped README troubleshooting table, the installer script and the verification report —
        and where the project files do not cover something, the page says so.
      </p>

      <h2>Step 1 — run the health check</h2>
      <ul>
        <li>
          In the app: <strong>Health check</strong> in the sidebar &rarr; <strong>Run full test</strong>. Every
          line is a real operation — it opens files, converts, OCRs and measures — and ends with counts of
          passes and failures. The recorded result for this build is <strong>PASS 20, FAIL 0</strong>.
        </li>
        <li>
          Then press <strong>Export diagnostic report</strong> in the same screen. That report, plus the logs
          in <code>data\logs</code>, is what a support request should carry.
        </li>
        <li>
          From the portable package: <code>START-APPLICATION\RUN-HEALTH-CHECK.bat</code> writes{" "}
          <code>Health_Report.html</code> even if the interface will not open.
        </li>
        <li>Quick UI fix to try first: press <strong>Ctrl+F5</strong> in the app window to force-reload it.</li>
      </ul>

      <h2>Symptom table</h2>
      <table>
        <tbody>
          <tr>
            <th>Symptom</th>
            <th>What it means</th>
            <th>What to do</th>
          </tr>
          <tr>
            <td>&ldquo;The bundled runtime folder is missing from this copy.&rdquo;</td>
            <td>The ZIP was not extracted in full, or <code>Application\runtime\</code> was deleted.</td>
            <td>Re-extract the whole archive; do not run files from inside the ZIP.</td>
          </tr>
          <tr>
            <td>Nothing at all happens when you start</td>
            <td>An antivirus or corporate download tool may have quarantined files under the runtime folder.</td>
            <td>Check quarantine first, restore the files, start again.</td>
          </tr>
          <tr>
            <td>First OCR run is slow</td>
            <td>Model warm-up of roughly 5&ndash;8 seconds happens once per launch.</td>
            <td>Nothing to fix — later calls are fast.</td>
          </tr>
          <tr>
            <td>Port 8765 already busy</td>
            <td>Something else (often a leftover instance) is listening on the app&rsquo;s port.</td>
            <td>
              Desktop mode picks the next free port automatically; the launcher is single-instance, so a second
              start brings the existing window forward. For web mode, pass <code>--port 8766</code>.
            </td>
          </tr>
          <tr>
            <td>Word to PDF fails</td>
            <td>Microsoft Word automation is unavailable on this machine.</td>
            <td>Install Microsoft Word, or let the built-in fallback handle it (that path is Not Verified — check the output).</td>
          </tr>
          <tr>
            <td>Nothing in the sidebar / a stale screen after an update</td>
            <td>Cached interface files from the previous version.</td>
            <td>Hard-refresh with <strong>Ctrl+Shift+R</strong> (or Ctrl+F5 in the app window).</td>
          </tr>
          <tr>
            <td>Window doesn&rsquo;t open</td>
            <td>
              The desktop shell could not create its native window — the README names a missing{" "}
              <em>WebView2 Runtime</em> as a cause (preinstalled on Windows 11).
            </td>
            <td>
              Use the browser route instead: the app falls back to your default browser, and both give the same
              application.
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Rows above are the troubleshooting entries of the shipped README and the installation guide, condensed.
        Rows about <code>pip</code> wheels and running from source only apply to a source checkout, where
        Python 3.10+ and <code>pip install -r requirements.txt</code> are required — packages carry their own
        runtime.
      </p>

      <h2>Nothing starts</h2>
      <CheckList
        items={[
          "Read the reason the launcher prints — it does not fail silently.",
          '"The bundled runtime folder is missing from this copy." means an incomplete extraction: extract the whole archive again.',
          "Nothing at all happening usually means an antivirus or corporate tool quarantined files under Application\\runtime — check there first.",
          "Confirm you are on a supported system: Windows 10 (1809 or newer) or Windows 11, 64-bit.",
          "If the interface opens but looks broken, Ctrl+F5 (app window) or Ctrl+Shift+R (browser) before anything else.",
        ]}
      />

      <h2>The window will not open</h2>
      <p>
        The app opens its own native window; if that cannot start, it opens in your default browser —{" "}
        <strong>both give you the same application</strong>, on the same local address, with your same data.
        Nothing is lost by using the browser route.
      </p>

      <h2>SmartScreen or antivirus warnings</h2>
      <div className="not-prose my-4">
        <Note icon="alert" title="The installer is not code-signed" tone="amber">
          Authenticode status measured on 2026-10-16: <strong>NotSigned</strong> for both the installer and the
          launcher. Windows SmartScreen and antivirus tools therefore have no publisher to trust, and may warn
          on a perfectly genuine file. There is no signing certificate anywhere in the project files — code
          signing is not something this release claims.
        </Note>
      </div>
      <p>The honest way to tell a genuine file from a tampered one is the hash:</p>
      <ul>
        <li>
          Compare the SHA-256 of your download with the value published on the{" "}
          <Link href="/download/">Download Center</Link> (all three packages were hashed on 2026-10-16).
        </li>
        <li>
          On PowerShell: <code>Get-FileHash .\IrfanPDF_Setup_1.7.0.exe -Algorithm SHA256</code>.
        </li>
        <li>
          If the hash matches and security software still blocks the file, that is an environment decision the
          project files cannot override — the files it may quarantine are the bundled runtime&rsquo;s, and the
          symptom is the startup row above.
        </li>
      </ul>

      <h2>Port already in use</h2>
      <p>
        The local server runs on <strong>127.0.0.1</strong> and normally on port <strong>8765</strong>. The
        launcher is single-instance (mutex <code>IrfanPDFSingleInstance</code>), so starting the app again
        brings the existing window forward instead of fighting over the port; desktop mode picks the next free
        port on its own, and web mode can be pointed elsewhere with <code>--port 8766</code>. The regression
        runner refuses to test against a server that was already listening, precisely because a stale instance
        answers with yesterday&rsquo;s code.
      </p>

      <h2>OCR or model problems</h2>
      <ul>
        <li>
          OCR must run from the <strong>bundled runtime</strong> — the models ship with the package, so a
          partial extraction (see the startup rows) is the usual cause of OCR failing while the rest works.
        </li>
        <li>
          Only the <strong>English PP-OCRv5</strong> model is bundled and verified. Other languages are{" "}
          <strong>Not Verified</strong>, and no Tesseract binary ships in any package.
        </li>
        <li>
          The first OCR call of a launch loads the models (roughly 5&ndash;8 seconds); later calls are fast.
        </li>
        <li>
          Digitally signed and encrypted PDFs are refused on purpose, with the reason given — that is design,
          not failure. See the <Link href="/docs/ocr-guide/">OCR guide</Link>.
        </li>
      </ul>

      <h2>PDF association issues</h2>
      <p>
        The installer offers a task named <strong>&ldquo;Open PDF files with Irfan PDF&rdquo;</strong> and adds
        an <strong>&ldquo;Open with Irfan PDF&rdquo;</strong> verb. The registry entries are written as an
        offer — the installer&rsquo;s own comment says user choice is recorded &ldquo;so Windows knows the app
        was offered (not forced)&rdquo; — and the association is never hijacked behind your back. If PDFs still
        open somewhere else: right-click a PDF &rarr; Open with &rarr; Irfan PDF, or re-run the installer and
        tick the association task. Whether your Windows build will let the default be changed, and what it does
        with a per-user association: <strong>Cannot verify from project files</strong>.
      </p>

      <h2>Still stuck</h2>
      <div className="not-prose my-4">
        <Note icon="info" title="No support channel is published yet">
          No email address, forum or issue tracker exists in the project files — <strong>Cannot verify from
          project files</strong>. The <Link href="/docs/contact/">contact page</Link> lists exactly what to put
          together so your request is useful the moment a channel exists: health report, logs from{" "}
          <code>data\logs</code>, reproduction steps, Windows version and app version 1.7.0.
        </Note>
      </div>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/installation/">Installation</Link> · <Link href="/docs/faq/">FAQ</Link> ·{" "}
        <Link href="/docs/contact/">Contact &amp; support</Link>
      </p>
    </article>
  );
}
