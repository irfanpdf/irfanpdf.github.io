import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note, CheckList } from "@/components/ui";
import { WINDOWS_REQ } from "@/data/downloads";

export const metadata: Metadata = {
  ...canonicalFor("/docs/installation"),
  title: "Installation",
  description:
    "Install Irfan PDF 1.7.0 on Windows 10 or 11: requirements, installer steps, the portable package, first run, how updating works and how to uninstall.",
};

export default function InstallationPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Installation</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Two ways to put the application on a PC: the Windows installer, or the self-contained portable
        package. Everything below comes from the shipped installation guide, the installer script and the
        verification report dated 2026-10-16 — nothing here is guessed.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>
          <strong>Operating system:</strong> {WINDOWS_REQ}. The installer declares 64-bit install mode
          (<code>ArchitecturesInstallIn64BitMode=x64compatible</code>) but sets no minimum-version check of
          its own — this requirement is the one stated in the shipped installation guide.
        </li>
        <li>
          <strong>Nothing alongside it:</strong> no Python to install, no pip to run, no internet
          connection, no account, no cloud service.
        </li>
        <li>
          <strong>Disk space:</strong> about 400 MB. Measured from the package itself on 2026-10-22: the
          Professional ZIP expands to 4,452 files / 365.6 MiB, of which{" "}
          <code>Application\runtime\</code> is 4,195 files / 355.8 MiB.
        </li>
        <li>
          <strong>No administrator rights:</strong> the installer is a per-user install
          (<code>PrivilegesRequired=lowest</code>), so it runs without elevation.
        </li>
      </ul>
      <div className="not-prose my-4">
        <Note icon="info" title="Where these numbers come from">
          Requirements and the &ldquo;no Python, no internet, no account&rdquo; statement are the wording of
          <code> INSTALLATION-GUIDE.md</code>. The file and byte counts above were read directly from the
          ZIP&rsquo;s central directory on 2026-10-22; the 400 MB line rounds 365.6 MiB up for planning.
          No other disk-space figure exists in the project files.
        </Note>
      </div>

      <h2>Option 1 — the installer</h2>
      <p>
        Run <strong>IrfanPDF_Setup_1.7.0.exe</strong> (Inno Setup 6, 64-bit, bundled runtime). The
        install folder is user-selectable and no administrator rights are required. What the installer sets
        up, straight from <code>installer\irfan_pdf.iss</code>:
      </p>
      <ul>
        <li>
          A Start Menu group (app, Health check, Uninstall) and — if you leave the task ticked — a Desktop
          shortcut. Every shortcut targets <code>IrfanPDF.exe</code>, the single-instance launcher.
        </li>
        <li>
          An optional <strong>.pdf association</strong> task (&ldquo;Open PDF files with Irfan PDF&rdquo;)
          plus an <strong>&ldquo;Open with Irfan PDF&rdquo;</strong> verb in the right-click menu for PDF
          files.
        </li>
        <li>A proper uninstall entry in Windows (Settings &rarr; Apps).</li>
        <li>
          The documentation folder (<code>Documentation\</code>, including <code>CHANGELOG.md</code>) and the
          shipped test suite at <code>tests\</code>.
        </li>
        <li>
          Two post-install buttons: start the app now, or run the self-test (Health check).
        </li>
      </ul>
      <div className="not-prose my-4">
        <Note icon="shield" title="Check the file before you run it" tone="green">
          Every package on the <Link href="/download/">Download Center</Link> is listed with its SHA-256,
          measured 2026-10-16. The installer is <strong>not</strong> Authenticode-signed, so Windows may show
          a warning even for the genuine file — the hash is how you tell. See{" "}
          <Link href="/docs/troubleshooting/">troubleshooting</Link> if SmartScreen or antivirus blocks it.
        </Note>
      </div>

      <h2>Option 2 — the portable package</h2>
      <p>
        <strong>IRFAN-PDF-PROFESSIONAL.zip</strong> is self-contained: 4,451 files, including{" "}
        <code>Application\runtime\</code> with 4,195 files and the shipped test suite (165 files). Steps, exactly as
        the installation guide gives them:
      </p>
      <ol>
        <li>Copy the ZIP to the PC.</li>
        <li>Extract it — <strong>extract the whole folder; do not run the files inside the ZIP</strong>.</li>
        <li>
          Open <code>START-APPLICATION</code> and double-click <code>START-APPLICATION.bat</code>.
        </li>
      </ol>
      <div className="not-prose my-4">
        <Note icon="alert" title="IrfanPDF_Portable.zip is Not Verified">
          The small source-style ZIP (<code>IrfanPDF_Portable.zip</code>) advertises a bundled runtime it does
          not contain, so it must not be used for a normal install. Use the installer or the Professional
          package. Details and hashes: <Link href="/download/">Download Center</Link>.
        </Note>
      </div>

      <h2>First run</h2>
      <ul>
        <li>
          The app opens its own window. If that cannot start, it opens in your default browser — both give
          you the same application.
        </li>
        <li>
          Open <strong>Health check</strong> in the sidebar and press <strong>Run full test</strong>. Every
          line is a real operation: it opens files, converts and measures, and ends with a count of passes
          and failures.
        </li>
        <li>
          From the portable package you can instead run{" "}
          <code>START-APPLICATION\RUN-HEALTH-CHECK.bat</code>, which writes <code>Health_Report.html</code>.
          The recorded self-test result for this build is PASS 20, FAIL 0.
        </li>
        <li>
          Your data lives next to the app: <code>Application\data\files</code> (documents),{" "}
          <code>data\logs</code> (logs), <code>data\settings.json</code> (preferences). Paths are relative, so
          you can move the whole <code>IRFAN-PDF</code> folder to another PC — a folder name with spaces or a
          different drive letter is fine.
        </li>
      </ul>

      <h2 id="updating">Updating</h2>
      <p>Updating is deliberately boring:</p>
      <ol>
        <li>Download the newer package from the <Link href="/download/">Download Center</Link>.</li>
        <li>
          <strong>Installer:</strong> run the newer setup EXE over the previous installation.
          <br />
          <strong>Portable:</strong> extract the newer archive and replace the previous folder.
        </li>
        <li>
          Your documents stay in the data folder (<code>data\files</code>, plus <code>data\backups</code> and{" "}
          <code>data\logs</code>). Back that folder up before you replace anything — copying the folder is also
          how you move to another PC.
        </li>
        <li>Run Health check &rarr; Run full test once after updating.</li>
      </ol>
      <div className="not-prose my-4">
        <Note icon="alert" title="There is no in-app updater">
          The project files contain no updater, no auto-update check and no download-at-start behaviour, so
          nothing updates itself: a new version is installed manually, as above. Anything beyond that —
          update notifications, a silent updater, an update feed — <strong>Cannot verify from project files</strong>.
        </Note>
      </div>

      <h2 id="uninstalling">Uninstalling</h2>
      <p>
        <strong>Installed with the EXE:</strong> close the app, then uninstall from Windows — Settings &rarr;
        Apps &rarr; Irfan PDF &rarr; Uninstall, or the &ldquo;Uninstall Irfan PDF&rdquo; Start Menu entry the
        installer creates. The uninstaller is registered with the app&rsquo;s icon and display name.
      </p>
      <p>
        <strong>Portable:</strong> close the app and delete the <code>IRFAN-PDF</code> folder.
      </p>
      <p>What actually gets removed, stated only as far as the installer script goes:</p>
      <CheckList
        items={[
          "Deleted by the uninstaller (its [UninstallDelete] entries): data\\temp, data\\jobs, data\\logs\\*.log and the __pycache__ folders.",
          "Left in place: your documents. The shipped test report says the uninstaller deliberately leaves the user's documents in place.",
          "Not listed for deletion anywhere in the installer script: data\\files, data\\backups, data\\models, data\\output and settings.json — their removal cannot be confirmed from the script, so treat them as staying behind. Cannot verify beyond the script.",
        ]}
      />
      <div className="not-prose my-4">
        <Note icon="lock" title="Back up the data folder before you uninstall">
          The data folder holds your documents, backups, logs and settings. Copy it somewhere safe first; the
          project files contain no &ldquo;export everything&rdquo; or &ldquo;undo uninstall&rdquo; feature, so
          once it is gone it is gone.
        </Note>
      </div>

      <h2>Running from a source checkout</h2>
      <p>
        Only relevant if you have the code rather than a package: then Python 3.10 or newer <em>is</em>{" "}
        needed, plus <code>pip install -r requirements.txt</code> once. Only built packages carry their own
        interpreter. For everything else, use the installer or the Professional package above.
      </p>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/troubleshooting/">Troubleshooting</Link> if something does not start ·{" "}
        <Link href="/docs/ocr-guide/">OCR guide</Link> · <Link href="/docs/faq/">FAQ</Link>
      </p>
    </article>
  );
}
