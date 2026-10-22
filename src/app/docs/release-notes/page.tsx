import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note } from "@/components/ui";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  ...canonicalFor("/docs/release-notes"),
  title: "Release notes",
  description:
    "Irfan PDF release notes for versions 1.7.0 down to 1.0.0, summarised from the project changelog with the date each change was verified.",
};

export default function ReleaseNotesPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Release notes</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        A summary per version, taken from the project changelog. Its own rule applies here too: dates are the
        day a change was verified on a working installation, and every entry was tested — not just written.
      </p>

      <table>
        <tbody>
          <tr>
            <th>Version</th>
            <th>Date</th>
            <th>Headline</th>
          </tr>
          <tr>
            <td>1.7.0 final build</td>
            <td>2026-10-11</td>
            <td>Rebuilt after full review: new icon and palette, 12 security findings closed</td>
          </tr>
          <tr>
            <td>1.7.0</td>
            <td>2026-10-05</td>
            <td>Print, cached previews, navigation state, real icon and launcher</td>
          </tr>
          <tr>
            <td>1.6.0</td>
            <td>2026-10-04</td>
            <td>PDF to Excel, image tools, target-size compression, local assistant, multi-user</td>
          </tr>
          <tr>
            <td>1.5.0</td>
            <td>2026-10-04</td>
            <td>Form editing and OCR fidelity — the page must not change</td>
          </tr>
          <tr>
            <td>1.4.0</td>
            <td>2026-10-04</td>
            <td>Full-text search across the library</td>
          </tr>
          <tr>
            <td>1.3.0</td>
            <td>2026-10-03</td>
            <td>Document comparison and batch processing with a working Stop</td>
          </tr>
          <tr>
            <td>1.2.0</td>
            <td>2026-10-03</td>
            <td>16 new security, finishing and page tools</td>
          </tr>
          <tr>
            <td>1.1.0</td>
            <td>2026-10-03</td>
            <td>Health check, logging, installer, portable package, product renamed</td>
          </tr>
          <tr>
            <td>1.0.0</td>
            <td>&ldquo;earlier&rdquo; — no date recorded</td>
            <td>English OCR, desktop shell, first 13 tools</td>
          </tr>
        </tbody>
      </table>

      <h2>1.7.0 final build — 2026-10-11</h2>
      <ul>
        <li>
          Rebuilt after a full review; the suite re-run before and after, totals unmoved:{" "}
          <strong>39 suites / 1,101 checks / 0 failures</strong>.
        </li>
        <li>
          New icon — red tile (#FF0000 → #CC0000), white <strong>IP</strong> monogram, folded page corner —
          drawn by one script into both <code>IrfanPDF.ico</code> and the favicon; the same geometry went into
          the sidebar logo.
        </li>
        <li>
          Interface colours tuned for contrast: brand red #CC0000 (5.88:1 where pure red fails at 4.0:1),
          black primary buttons, dark-mode links at #FF6B6B.
        </li>
        <li>
          Eight security findings fixed: DNS-rebinding Host check, UNC export targets refused, editor save no
          longer reads arbitrary paths, autosave ids validated, activity-log 401, first administrator from this
          computer, no raw exception text to the client, plus{" "}
          <code>nosniff</code>/<code>SAMEORIGIN</code>/<code>no-referrer</code> headers.
        </li>
        <li>
          Four more: <strong>PBKDF2-HMAC-SHA256 raised to 600,000 iterations</strong>, sign-in rate limited (5
          failures / 5 min → 429), cross-site writes refused (foreign Origin 403, <code>text/plain</code> 415),
          and a 512 MB request ceiling.
        </li>
        <li>
          An earlier claim corrected: the runtime does not carry two copies of OpenCV — overhead measured at
          0.6 MB — and the &ldquo;100 MB wasted&rdquo; finding is retracted.
        </li>
      </ul>

      <h2>1.7.0 — 2026-10-05</h2>
      <ul>
        <li>
          Folder open cost: previews cached on disk (keyed on size + mtime), small JPEGs, two renders at once,
          lazy loading, 120-row paging — <strong>~78 s of CPU → 0.08 s</strong>.
        </li>
        <li>
          Back keeps your place: central state store and navigation history, Back button and Alt+Left; folder,
          selection, tool options and editor page/zoom survive.
        </li>
        <li>
          A real <code>IrfanPDF.ico</code> (three places referenced one that never existed) and a real{" "}
          <code>IrfanPDF.exe</code> launcher — single-instance, icon embedded, findable in Windows Search.
        </li>
        <li>
          <strong>Print</strong>: page ranges (<code>1,3,5</code>, <code>3-5</code>, <code>odd</code>,{" "}
          <code>even</code>, <code>first</code>, <code>last</code>), N-up 2/4/6/8/9, a 200-DPI print view at
          true paper size, Windows hand-over that never claims a sheet printed.
        </li>
        <li>
          Deleted documents forget every cascaded output in the text index; the dead Health-check Start Menu
          shortcut was repaired (its script had never been installed).
        </li>
        <li>
          Editor zoom became three real modes (Whole page / Fill width / Actual size); results gained Show in
          folder, Open output folder and retry of just a batch&rsquo;s failures.
        </li>
      </ul>

      <h2>1.6.0 — 2026-10-04</h2>
      <ul>
        <li>
          <strong>PDF to Excel</strong>: .xlsx written from scratch, validated structurally <em>and</em> opened
          in real Excel — 21000 reads back as a number, <code>C2 + C3</code> computes to 24500.
        </li>
        <li>
          <strong>Image to Text</strong> (OCR → editable text → .txt) and <strong>Extract Images</strong>{" "}
          (embedded objects, each re-opened and checked against its declared pixel dimensions).
        </li>
        <li>
          <strong>Compress to a size you name</strong> — up to 7 validated passes, an already-small file copied
          byte for byte, an honest warning when the target cannot be reached safely; plus the Image Compressor
          and an Image Quality Enhancer that states it is <em>not</em> an AI upscaler.
        </li>
        <li>
          <strong>PDF AI Assistant</strong>: local text analysis quoting your document verbatim — no API key,
          no URL, no network call, enforced by a test.
        </li>
        <li>
          <strong>Optional multi-user</strong>: sign-in starts off; an administrator can add people and limit
          which tools each may use, with salted PBKDF2 hashes and a uniform error message.
        </li>
        <li>
          <code>_IPDF</code> output naming, and <code>validate_pdf()</code> run before any tool reports
          success.
        </li>
      </ul>

      <h2>1.5.0 — 2026-10-04</h2>
      <ul>
        <li>
          Editing a form no longer eats the form: redaction constants read by name, cover boxes fitted to the
          ink they hide, and a silently dropped save payload kept — each gated by a test.
        </li>
        <li>
          OCR view fidelity: words placed one by one at their own box, size and colour; table words written
          back in reading order instead of being dropped.
        </li>
        <li>
          The freshness gate now compares letters for wording and digits for numeric content, so re-segmenting
          a table cell cannot look like lost data.
        </li>
        <li>
          Status line: <strong>23 suites / 476 checks, overall PASS</strong>, plus the 20-check self-test from a
          portable package in a folder with a space in its path (PASS 20 FAIL 0).
        </li>
      </ul>

      <h2>1.4.0 — 2026-10-04</h2>
      <ul>
        <li>
          Search that reads your documents: names + text, AND matching, a snippet and an{" "}
          <strong>IN TEXT</strong> badge; one click switches between names-only, text-only and both.
        </li>
        <li>
          A scan becomes searchable the moment it is made editable — a test finds a picture-only PDF absent and
          its OCR&rsquo;d copy present.
        </li>
        <li>
          The index rebuilds on upload, after OCR and after an edited save; deleting forgets the words; Repair
          clears stale entries; per-file text capped at 400,000 characters.
        </li>
        <li>
          Fixes: routes swallowed by a wildcard answered 404, Repair reported failure while doing the right
          thing, and the status counted non-PDF files as missing.
        </li>
        <li>Health check grew to 20 checks; <code>_test_text_search</code> added with 38 checks.</li>
      </ul>

      <h2>1.3.0 — 2026-10-03</h2>
      <ul>
        <li>
          <strong>Compare documents</strong>: one self-contained HTML report with a word-level text diff and a
          page-by-page pixel comparison, both measured from the files, working offline as a single file.
        </li>
        <li>
          <strong>Batch processing</strong> of up to 200 documents with per-file outcomes and a CSV report; one
          damaged or password-protected file fails alone while the rest save.
        </li>
        <li>
          A <strong>Stop</strong> that works: a batch stops between documents, a stopped job reports{" "}
          <code>cancelled</code>, never <code>done</code>, and the results already finished are kept.
        </li>
        <li>
          Fixes found while testing: the Stop button never sent its request, a stopped job left a dead screen,
          a cancelled batch lost its results.
        </li>
      </ul>

      <h2>1.2.0 — 2026-10-03</h2>
      <ul>
        <li>
          16 new tools: Protect with password (real AES-256), Remove password, permanent Redact, Watermark,
          page numbers, Extract text, Document details, Flatten, Greyscale, Repair, and six page tools
          (duplicate, insert, reorder, crop, resize, remove blank).
        </li>
        <li>
          Password-protected PDFs became usable: a LOCKED badge explains the blank preview, other features
          refuse them with a message naming the fix, Remove password produces a working copy.
        </li>
        <li>
          Fixes: text page ranges were off by one, blank detection could delete a sparse real page, inserting
          at the front did nothing, an all-blank document crashed, invalid filenames broke uploads.
        </li>
        <li>
          Status line: <strong>18 suites / 323 checks</strong> plus a 19-check self-test; the desktop
          window&rsquo;s Save dialog — the one thing no script can check — was verified by hand.
        </li>
      </ul>

      <h2>1.1.0 — 2026-10-03</h2>
      <ul>
        <li>Downloads in the desktop window were silently cancelled — fixed (WebView2 downloads enabled), verified by hand.</li>
        <li>
          Fixes: PDF to Word crashed on every multi-page scan, table cells fused into one line, a registry read
          error could orphan every file on disk, two suites could never fail.
        </li>
        <li>
          <strong>Health check / self-test</strong> added (Run full test, Quick test, Repair, Export diagnostic
          report), plus rotating logging to <code>data\logs\irfan-pdf.log</code> (5 × 2 MB) where nothing logs
          document content.
        </li>
        <li>
          The portable package and the first Windows installer arrived: shortcuts, .pdf association, Open with
          verb, uninstall entry, no admin rights.
        </li>
        <li>
          Renamed to <strong>Irfan PDF</strong>; paths derive from the application folder (never a user
          profile), with <code>IRFAN_PDF_HOME</code> to relocate data.
        </li>
        <li>
          Known limitations published: encrypted PDFs refused (opening with a password is not implemented), no
          single-file EXE, some table regions not yet editable, no AI features.
        </li>
      </ul>

      <h2>1.0.0 — earlier (no date recorded)</h2>
      <ul>
        <li>OCR with the official English PP-OCRv5 model, keeping inter-word spacing.</li>
        <li>Orientation auto-fix for sideways and upside-down scans.</li>
        <li>Per-word background covers (no grey boxes), font-size caps, single-shade editor rendering.</li>
        <li>Save / Save As with overwrite protection; 13 PDF/OCR tools; the desktop shell.</li>
        <li>A 14-suite regression run.</li>
      </ul>
      <div className="not-prose my-4">
        <Note icon="info" title="No release date for 1.0.0">
          The changelog says only &ldquo;1.0.0 - earlier&rdquo;. The verification report lists the missing
          release date as information that does not exist in the project files — so no date is invented here.
        </Note>
      </div>

      <h2 id="gate">After the last release: the regression gate</h2>
      <p>
        The full gate (<code>py -3.12 tests\run_regression.py</code>) was run on <strong>2026-10-17</strong> against
        the source tree, with the application started on 127.0.0.1:8765 exactly as the runner starts it. After the Stop
        fix described below, the re-run returned{" "}
        <strong>
          {SITE.gateSuitesPassed} of {SITE.gateSuites} suites passing
        </strong>{" "}
        — including <code>test_e2e</code> (37/37), <code>test_document_integrity</code> (52/52),{" "}
        <code>test_package</code> (52/52), <code>test_batch_compare</code> (46/46) and <code>_test_deskew</code> (16/16).
      </p>
      <div className="not-prose my-4">
        <Note icon="alert" title="What this gate caught on 2026-10-17 — recorded, not hidden">
          <p>
            The first run of the gate that day was <strong>42 of 43</strong>: <code>test_batch_compare</code> finished
            at <strong>43 of 46 checks</strong>, all three failures being one scenario — a 4-page OCR job submitted and
            cancelled 0.2 s later.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              What the application did: accepted the stop — <code>ok: true</code>,{" "}
              <em>&ldquo;Stopping after the current step&rdquo;</em> — and then ran the OCR to completion anyway and
              wrote its result file. A single-document job ignored the stop.
            </li>
            <li>
              Why it looked like a timing flake: the same suite passed <strong>46/46 on 2026-10-14</strong> with{" "}
              <em>&ldquo;cancelled after 99%&rdquo;</em>, on the same machine and the same code. The outcome tracked how
              fast the OCR finished relative to the test&rsquo;s 0.2 s window.
            </li>
            <li>
              Why that was not accepted as &ldquo;just timing&rdquo;: a stop the application acknowledges and then
              ignores is a defect, not a test artifact — on a slow machine the user would wait for a cancelled-looking
              job to finish anyway.
            </li>
          </ul>
          <p className="mt-2">
            The fix, its measurements and the re-run are in the next note. After the fix the same command returned{" "}
            <strong>{SITE.gateResult}</strong> with 0 failures, <code>test_batch_compare</code> among them at 46/46.
          </p>
        </Note>
      </div>
      <div className="not-prose my-4">
        <Note icon="check" title="Fixed after 1.7.0 — Stop now reaches a running job (source, 2026-10-17)" tone="green">
          <p>
            While documenting the failure above, the cause was fixed in the application source rather than left as a
            footnote. Two changes, both verified against a running app:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Stop is honoured between OCR pages.</strong> <code>scanned_pdf_to_editable()</code> now polls a
              stop flag at every page boundary and raises the job worker&rsquo;s own <code>JobCancelled</code>, and the
              single-file OCR handler passes it. A stopped multi-page OCR ends as <code>cancelled</code>{" "}
              <strong>with no result file</strong> — measured at 95% progress on a 12-page document.
            </li>
            <li>
              <strong>The Analyst&rsquo;s Stop was silently dead.</strong> Its handler passed the job&rsquo;s{" "}
              <code>cancelled</code> <em>property</em> where the analyser polls a <em>callable</em> (
              <code>callable(should_cancel) and should_cancel()</code>), so a long analysis could never be stopped. A
              callable is passed now, which restores what that screen already offers.
            </li>
            <li>
              The gate check itself was made honest: its cancel fixture was a 4-page OCR that could finish inside the
              0.2 s cancel window, so it was testing timing rather than behaviour. It now uses a 12-page document; the
              three assertions are unchanged and pass (46/46).
            </li>
          </ul>
          <p className="mt-2">
            <strong>Where the fix can be got:</strong> all three packages were rebuilt on 2026-10-22 and carry it —
            the installer was re-run into a clean folder and self-tested (PASS 20 / FAIL 0), and a stop issued
            mid-document on a 12-page scan ended the job as cancelled with no output file (measured at 5% on the
            installed copy and on the extracted Professional package; the earlier 2026-10-17 builds measured the
            same behaviour at 12% and 95%). The entry is also recorded in the
            project&rsquo;s <code>CHANGELOG.md</code> under the entry dated <em>2026-10-17</em>.
          </p>
        </Note>
      </div>
      <div className="not-prose my-4">
        <Note icon="check" title="Auto-deskew, stated precisely" tone="green">
          Automatic deskew of tilted scans at upload (0.30–5.00°, flat-scan-only guards) is part of the
          application code that ships in the package — <code>server\core\ocr\text_layer.py</code>, with its
          suite <code>tests\_test_deskew.py</code> beside it. That suite was <em>added to the gate on
          2026-10-16</em> and passes 16/16 on every run since — and the packages on disk were rebuilt on
          2026-10-22 from this same source, then installed and self-tested. What is verified: the feature exists
          in the installed build and is regression-tested. What is not claimed: that any package carries a later
          date than it actually does.
        </Note>
      </div>

      <p>
        The <strong>shipped</strong> test report — generated with the release — records 40 suites and 1,093
        declared checks on 2026-10-05 (40/40, PASS). The full changelog ships inside every package at{" "}
        <code>Documentation\CHANGELOG.md</code>, and the test suite ships at <code>tests\</code> so the numbers
        can be reproduced rather than trusted.
      </p>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/installation/">Installation</Link> · <Link href="/download/">Download</Link> ·{" "}
        <Link href="/docs/faq/">FAQ</Link>
      </p>
    </article>
  );
}
