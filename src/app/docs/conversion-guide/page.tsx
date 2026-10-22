import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note, CheckList } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/conversion-guide"),
  title: "Conversion guide",
  description:
    "What each Irfan PDF converter actually does — PDF to Word, Word to PDF, images, Excel, text and compression — and how to verify the output yourself.",
};

export default function ConversionGuidePage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Conversion guide</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        One section per converter, each one described from the verification report and the shipped test
        results rather than from a feature list. Where a code path exists but was not exercised, the page says
        so.
      </p>

      <h2>To Word (.docx)</h2>

      <h3>PDF to Word</h3>
      <p>
        A native PDF becomes a real Word document — selectable text, paragraphs and tables, not a picture of
        the page. Layout is produced with <code>pdf2docx</code>, and <strong>Microsoft Word itself</strong> is
        used as an accuracy fallback when Word is installed on your PC. Verified end to end by{" "}
        <code>test_e2e</code> (37 checks) for both text PDFs and scanned ones (the scan is OCR&rsquo;d first).
      </p>
      <p>
        The fallback path — the built-in converter that runs when Word is <em>not</em> installed — is
        described in the project README but was not exercised: <strong>Not Verified</strong> without Microsoft
        Word.
      </p>

      <h3>Image (JPG/PNG) to Word</h3>
      <p>
        A photo or scan becomes a paragraph- and table-aware DOCX with real text. The test opens the result and
        reads real DOCX paragraphs back — explicitly not an image pasted into a document.
      </p>

      <h3>Word to PDF</h3>
      <p>
        Driven through Microsoft Word automation (COM) when Word is installed; the health check exercises this
        path. A built-in fallback converter is described in the README for machines without Word —{" "}
        <strong>the fallback path itself is Not Verified</strong>, so treat a Word-free machine&rsquo;s result
        as unconfirmed until you have checked it.
      </p>

      <div className="not-prose my-4">
        <Note icon="info" title="What that means in practice">
          If you need certified fidelity, convert on a machine with Microsoft Word installed — that is the path
          the tests ran. See the <Link href="/docs/faq/">FAQ</Link> for the short version of every limitation.
        </Note>
      </div>

      <h2>Images and pages</h2>

      <h3>JPG/PNG to PDF</h3>
      <p>
        Images are assembled into a PDF. Exercised by the health check (a real conversion, re-opened
        afterwards) and by <code>test_tool_wiring</code> (55 checks, the guard that every tool shown has a
        real backend handler).
      </p>

      <h3>PDF to Images</h3>
      <p>
        Renders <strong>every page</strong> of the PDF as an image file. This is the right tool for a
        picture-only result; it is also what a text-only PDF is pointed to when it has no embedded pictures.
      </p>

      <h3>Extract Images</h3>
      <p>
        Different from PDF to Images: this writes the <em>embedded picture objects</em> the PDF is built from,
        deduplicates them, and <strong>re-opens each written file to compare its pixel dimensions with what
        the document declared</strong> — a mismatch is discarded rather than reported as a success. A PDF with
        no pictures is refused with a pointer to PDF to Images. Evidence: <code>_test_extract_tools</code> (34
        checks).
      </p>

      <h3>PDF to Excel (.xlsx)</h3>
      <p>
        The workbook is written from scratch (an .xlsx is a ZIP of XML parts), with one worksheet per page:
        rows are rebuilt by clustering words onto baselines and splitting on real column gaps. Then it is
        validated structurally <strong>and opened in real Excel</strong> — a cell holding 21000 must read back
        as the <em>number</em> 21000, <code>C2 + C3</code> must compute to 24500, and a decimal such as
        90860.00 must come back as the number 90860. A PDF with no text is refused with &ldquo;run OCR on it
        first&rdquo; rather than producing an empty workbook.
      </p>

      <h2>Text</h2>

      <h3>Extract text to .txt</h3>
      <p>
        Writes the document&rsquo;s text layer to a <code>.txt</code> file, honouring the page selection you
        gave. Verified by <code>test_security_pages</code> (73 checks). On a scan with no text layer, run OCR
        first — see the <Link href="/docs/ocr-guide/">OCR guide</Link>.
      </p>

      <h3>Image to Text</h3>
      <p>
        OCR a picture, read the words as editable text on screen, correct them, then save a <code>.txt</code>.
        A picture with no writing on it says so plainly instead of returning a blank success, and empty text
        cannot be saved. Evidence: <code>_test_extract_tools</code> (34 checks).
      </p>

      <h2>Compress</h2>
      <p>Two ways to work, both tested:</p>
      <ul>
        <li>
          <strong>Quick compression</strong> — Low / Medium / High, one click each.
        </li>
        <li>
          <strong>Target size</strong> — you name a size in MB and the app chooses resolution, DPI, JPEG
          quality, colour depth and metadata removal, running <strong>up to 7 increasingly aggressive passes</strong>.
          Every candidate must open, keep its page count and render its first page before it is even measured;
          a file already at or below the target is copied byte for byte instead of being degraded.
        </li>
      </ul>
      <div className="not-prose my-4">
        <Note icon="alert" title="If the target cannot be reached honestly">
          When squeezing further would destroy the document, the app delivers the closest <em>valid</em> result
          with a plain-language warning naming both numbers — it never reports a success it did not achieve.
          Each result reports original size, target, final size, space saved, percentage, pass count and
          whether the target was reached. Measured example: an 18.7 MB eight-page scan to a 2 MB target came
          out at 1.40 MB in 2 passes.
        </Note>
      </div>

      <h2>How to verify any conversion</h2>
      <p>
        The app validates its own outputs before it says &ldquo;done&rdquo; — a PDF must exist, be non-empty,
        open, keep its page count and render its first page (<code>validate_pdf()</code>); DOCX and XLSX files
        are reopened and read back; image dimensions are re-measured; compressed sizes are re-measured. That is
        its check. Yours should be a minute of yours:
      </p>
      <CheckList
        items={[
          "Open the output in its own application (Word, Excel, an image viewer) — not only in the app's preview.",
          "Compare the page count with the source document.",
          "Spot-check two or three numbers, dates and names character by character against the original.",
          "For Excel: click a cell that should be a number and confirm Excel treats it as a number, not text.",
          "For images: confirm the resolution stated in the result matches what you needed.",
          "Generated files carry a suffix such as _IPDF (compressed) — keep the source file beside it until you are satisfied.",
        ]}
      />

      <div className="not-prose my-4">
        <Note icon="report" title="Evidence" tone="green">
          The checks above were executed in the regression gate of 2026-10-17 (43 suites, all passing) after the Stop fix described in the release notes and in
          the shipped test report of 2026-10-05 (40 suites, 1,093 checks). Nothing on this page was written
          from a screenshot or a wish.
        </Note>
      </div>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/ocr-guide/">OCR guide</Link> · <Link href="/features/">Features</Link> ·{" "}
        <Link href="/docs/troubleshooting/">Troubleshooting</Link>
      </p>
    </article>
  );
}
