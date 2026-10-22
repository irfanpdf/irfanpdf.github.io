import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/faq"),
  title: "FAQ",
  description:
    "Straight answers about Irfan PDF: whether documents leave your PC, requirements, price, OCR languages, signed and encrypted PDFs, offline use, platforms and how accurate OCR is.",
};

export default function FaqPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">FAQ</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        The questions people ask before downloading, answered from the project files. If an answer is not
        written here, it is because the files do not support it — not because it was left out on purpose.
      </p>

      <h2>Do my documents get uploaded anywhere?</h2>
      <p>
        <strong>No.</strong> The application is a local Windows program: its server binds to{" "}
        <code>127.0.0.1</code> only, so it is reachable from this computer and nothing else. A grep across the
        server and interface code on 2026-10-16 found no HTTP client, no telemetry and no analytics code. Your
        documents, thumbnails, drafts and settings live in the local data folder. See the{" "}
        <Link href="/docs/privacy/">privacy policy</Link> and the <Link href="/security/">security page</Link>.
      </p>

      <h2>Do I need Python or an internet connection?</h2>
      <p>
        <strong>Neither.</strong> The installer and the Professional package carry their own Python runtime and
        libraries, so there is nothing to install alongside them: no Python, no pip, no internet connection, no
        account, no cloud service. The only exception is running from a source checkout, which needs Python
        3.10 or newer and <code>pip install -r requirements.txt</code>.
      </p>

      <h2>Is it free?</h2>
      <p>
        <strong>Yes.</strong> No payment, subscription or licensing code exists anywhere in the project files,
        and the shipped test report records that no paid or network service is required by the software. The
        licensing terms themselves: <strong>Cannot verify from project files</strong> — there is no LICENSE
        file; the README states only &ldquo;Original code and design built for this project&rdquo;. See the{" "}
        <Link href="/docs/terms/">terms of use</Link>.
      </p>

      <h2>Will OCR change how my document looks?</h2>
      <p>
        It depends which mode you pick. <strong>Searchable OCR</strong> adds an invisible text layer: the page
        still looks exactly like the scan. <strong>Editable OCR</strong> replaces the printed glyphs with real
        text so you can correct words — layout changes may occur and formatting may differ. Full detail in the{" "}
        <Link href="/docs/ocr-guide/">OCR guide</Link>.
      </p>

      <h2>Which languages can OCR read?</h2>
      <p>
        <strong>English only, as shipped.</strong> The official English PP-OCRv5 model is the one bundled and
        verified. An &ldquo;OCR language&rdquo; setting exists in the app, but recognition in any other
        language is <strong>Not Verified</strong> and no other model ships in the package.
      </p>

      <h2>What happens to digitally signed PDFs?</h2>
      <p>
        They are <strong>refused, not modified</strong>. Adding or changing anything in a signed file would
        invalidate the signature, so the app explains the situation and writes nothing — verified in the
        regression gate (latest run 2026-10-17, 43/43, <code>test_document_integrity</code> 52/52), which checked that a
        signed PDF is refused without confirmation and
        that nothing was written when it was refused. The project never claims signature validity is preserved
        after a modification.
      </p>

      <h2>What about password-protected (encrypted) PDFs?</h2>
      <p>
        They are <strong>refused with a message that names the fix</strong>. If you know the password, the{" "}
        <strong>Remove password</strong> tool produces a fully working copy — a wrong password is reported,
        never silently ignored — and the locked file still shows a LOCKED badge in the library. Opening a file
        you do <em>not</em> have the password for is not implemented; that is on the project&rsquo;s own honest
        limitations list.
      </p>

      <h2>What is the difference between searchable and editable OCR?</h2>
      <p>
        Searchable OCR tags the page: the picture stays untouched and an invisible text layer makes the words
        findable. Editable OCR rebuilds the page: the printed glyphs are covered and real, editable text is
        inserted in their place, which is what lets you fix a wrong word — at the cost of a layout that may
        differ from the scan. See the comparison table in the <Link href="/docs/ocr-guide/">OCR guide</Link>.
      </p>

      <h2>Does it work completely offline?</h2>
      <p>
        <strong>Yes.</strong> Recognition, conversion, search, the document assistant and printing all run on
        your machine with local models and libraries. The module that analyses documents contains no API key,
        no URL and no network call, and a test enforces that. Even the interface is served from the local
        process — no fonts, icons or scripts are fetched from the internet.
      </p>

      <h2>Is there a mobile or web version?</h2>
      <p>
        <strong>No.</strong> Irfan PDF is a Windows desktop application for Windows 10 (1809 or newer) or
        Windows 11, 64-bit. There is no cloud service, no sync, no mobile app and no hosted web version — the
        verification report lists all of those as things that simply do not exist. Opening the app in a browser
        on the same PC is the same local application, not a separate product.
      </p>

      <h2>How do I know a conversion worked?</h2>
      <p>
        The app checks its own output before reporting success: a PDF must exist, open, keep its page count and
        render its first page; DOCX and XLSX files are reopened and read back (the Excel test opens the
        workbook in real Excel and requires a cell to read as a <em>number</em>, not text); extracted images
        are re-read and their pixel dimensions compared; compressed sizes are re-measured. Your own check is
        the last word — see <Link href="/docs/conversion-guide/">how to verify any conversion</Link>.
      </p>

      <h2>How accurate is OCR?</h2>
      <p>
        Honest answer: <strong>no OCR system is perfect</strong>, and this one does not claim to be. Recognition
        errors happen — especially on faint or badly skewed scans — and the English model&rsquo;s performance on
        other scripts is Not Verified. Always check critical numbers, names and dates against the original
        page, and never use OCR output alone for legal, medical or financial figures.
      </p>

      <div className="not-prose my-4">
        <Note icon="info" title="Still missing something?">
          No support channel (email, forum or issue tracker) is published in the project files — so questions
          that go beyond this page cannot currently be routed anywhere. The{" "}
          <Link href="/docs/contact/">contact page</Link> says exactly what a request should contain once a
          channel exists.
        </Note>
      </div>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Next: <Link href="/docs/installation/">Installation</Link> ·{" "}
        <Link href="/docs/release-notes/">Release notes</Link> · <Link href="/download/">Download</Link>
      </p>
    </article>
  );
}
