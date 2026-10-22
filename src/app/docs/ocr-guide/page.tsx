import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note, CheckList } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/ocr-guide"),
  title: "OCR guide",
  description:
    "Searchable OCR vs editable OCR in Irfan PDF: what each mode preserves, what can go wrong, which languages are supported and how to check the result.",
};

export default function OcrGuidePage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">OCR guide</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        OCR (optical character recognition) reads the text out of a scan and turns a picture of a page into
        characters a computer can find. Irfan PDF offers two ways to do it, and they make a different trade:
        one keeps the page exactly as it looks, the other gives you text you can correct.
      </p>

      <div className="not-prose my-4">
        <Note icon="alert" title="OCR can introduce recognition errors" tone="red">
          No OCR system is perfect, and this one is not claimed to be. Characters get confused — 0 with O, 1
          with l, rn with m — especially on faint, skewed or low-resolution scans. <strong>Never rely on OCR
          alone for legal, medical or financial numbers.</strong> Check any number, name or date that matters
          against the original page before you use it.
        </Note>
      </div>

      <h2>How OCR runs here</h2>
      <ul>
        <li>
          The engine is RapidOCR (<code>rapidocr-onnxruntime</code> 1.4.4) on ONNX Runtime with the official
          English <strong>PP-OCRv5</strong> recognition model. It runs fully offline on your machine — no
          Tesseract install, no cloud OCR, no API key.
        </li>
        <li>
          On upload, scans are auto-oriented (sideways or upside-down pages are turned upright) and{" "}
          <strong>automatically deskewed</strong> when the measured tilt is between 0.30° and 5.00°, with
          guards that only apply it to flat scans.
        </li>
        <li>
          Multi-page scanned PDFs are processed page by page, with per-page progress.
        </li>
      </ul>

      <h2>Searchable OCR</h2>
      <p>
        Adds an <strong>invisible text layer</strong> over the page image. The words can be selected, copied
        and searched, but nothing you see changes — the page still looks exactly like the scan.
      </p>
      <ul>
        <li>Original appearance preserved: word-level placement, size and sampled colour.</li>
        <li>
          Preserved through the tests: signatures, stamps, digits and overall visual appearance, plus page
          dimensions and layout (<code>test_document_integrity</code>, 52 checks).
        </li>
        <li>
          The document becomes findable in the library the moment it has a text layer — searching a word
          inside the scan returns the file with the matching sentence.
        </li>
        <li>
          <strong>Best for:</strong> archives, records and anything you want to search or keep looking exactly
          as it does today.
        </li>
      </ul>

      <h2>Editable OCR</h2>
      <p>
        Covers the printed glyphs and inserts <strong>real, selectable, editable text</strong> at their
        original positions, so you can click a word in the editor and fix it.
      </p>
      <ul>
        <li>Table cells are written back in reading order (row by row, left to right).</li>
        <li>
          <strong>Layout changes may occur and formatting may differ.</strong> This mode rebuilds text rather
          than merely tagging it: spacing, line breaks, columns and typeface can come out differently from the
          original scan, and recognition mistakes are now yours to correct.
        </li>
        <li>
          <strong>Best for:</strong> when you must fix words — a wrong name or amount in a form — and you are
          willing to re-check the layout afterwards.
        </li>
      </ul>

      <table>
        <tbody>
          <tr>
            <th>Mode</th>
            <td>Searchable OCR</td>
            <td>Editable OCR</td>
          </tr>
          <tr>
            <th>What it changes</th>
            <td>Nothing you can see — an invisible text layer is added.</td>
            <td>The printed glyphs are covered and replaced with real text.</td>
          </tr>
          <tr>
            <th>Layout risk</th>
            <td>None: appearance is preserved.</td>
            <td>Layout and formatting may differ from the original.</td>
          </tr>
          <tr>
            <th>Use it when</th>
            <td>You want to search and keep the page as-is.</td>
            <td>You need to correct the words themselves.</td>
          </tr>
        </tbody>
      </table>

      <h2>Shared limits — read these before you start</h2>
      <ul>
        <li>
          <strong>English only.</strong> Only the official English PP-OCRv5 model is bundled and verified. An
          &ldquo;OCR language&rdquo; setting exists, but recognition in any other language is{" "}
          <strong>Not Verified</strong> and must not be relied on.
        </li>
        <li>
          <strong>Errors happen.</strong> See the warning above: check anything critical against the original.
        </li>
        <li>
          <strong>Digitally signed PDFs are refused.</strong> Adding a text layer would invalidate the
          signature, so the app explains and refuses instead of quietly breaking it — nothing is written when
          a file is refused.
        </li>
        <li>
          <strong>Encrypted (password-protected) PDFs are refused</strong> with a message that names the fix.
          Removing a password you know is available as a tool; opening a file you do not have the password
          for is not implemented.
        </li>
      </ul>

      <div className="not-prose my-4">
        <Note icon="shield" title="What the tests check about preservation" tone="green">
          Page dimensions and layout are verified by <code>test_document_integrity</code> (52 checks);
          signatures, stamps, digits and visual appearance through OCR by <code>_test_ocr_fidelity</code> (19),
          <code> recert_freshness</code> (12), <code>recert2_analysis</code> (11) and{" "}
          <code>_test_font_preserve</code> (24) - all in the 43-suite gate, all 43 passing on the 2026-10-17 run. What is{" "}
          <strong>never</strong> claimed: 100% signature validity after a modification. That is exactly why
          signed files are refused instead of edited.
        </Note>
      </div>

      <h2>How to check the result</h2>
      <CheckList
        items={[
          "Search two or three words you know are on the page — if search finds them, the text layer is real.",
          "Spot-check names, dates and amounts against the original image, character by character.",
          "For editable OCR, scroll the whole document once: a rebuild can shift columns, line breaks or spacing even when every word is right.",
          "OCR writes a new file — for example invoice (searchable).pdf or invoice (editable).pdf — and leaves the original untouched, so you always have the source to compare against.",
        ]}
      />

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/conversion-guide/">Conversion guide</Link> (Word, Excel, images) ·{" "}
        <Link href="/docs/faq/">FAQ</Link> · <Link href="/security/">Security</Link>
      </p>
    </article>
  );
}
