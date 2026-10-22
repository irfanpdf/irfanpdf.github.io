import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { Note } from "@/components/ui";

export const metadata: Metadata = {
  ...canonicalFor("/docs/terms"),
  title: "Terms of use",
  description:
    "Terms of use for the Irfan PDF website and software: informational use, comparison sources and their dates, licensing status, no warranty and plain-language limitations.",
};

export default function TermsPage() {
  return (
    <article className="prose-page max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Terms of use</h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
        Plain language, no decoration. This page covers the website you are reading and the Irfan PDF software
        it describes. Facts on this site were checked against project files on 2026-10-16; anything unverified
        is labelled as such rather than smoothed over.
      </p>

      <h2>Using this website</h2>
      <ul>
        <li>
          The site is <strong>informational</strong>. It describes a Windows desktop application, how to get it
          and how it behaves — it does not sell, licence or deliver anything itself.
        </li>
        <li>
          There is no account, no login and no form that collects personal data from you. See the{" "}
          <Link href="/docs/privacy/">privacy policy</Link> for the single localStorage entry the site uses.
        </li>
        <li>
          Documentation pages describe version <strong>1.7.0</strong> as shipped. If a capability is not in the{" "}
          <Link href="/features/">Features list</Link> or not stated in the documentation, treat it as absent.
        </li>
      </ul>

      <h2>Comparison data and third-party products</h2>
      <ul>
        <li>
          Rows comparing this product with others were fetched from the vendors&rsquo; <strong>official
          pages</strong> and are cited on the <Link href="/compare/">Compare page</Link> with a verification
          date of <strong>2026-10-16</strong>.
        </li>
        <li>
          Prices, plans, trial terms and feature sets change without notice. A figure shown here is a
          photograph of that date — <strong>re-check the vendor&rsquo;s official site</strong> before relying on
          it.
        </li>
        <li>
          Adobe, Foxit, Tracker Software (PDF-XChange) and PDF24 (AVC) are named <strong>only to identify the
          products being compared</strong>. There is no affiliation, endorsement, sponsorship or partnership
          with any of them.
        </li>
        <li>
          Any statement about another product that its official page did not support is marked{" "}
          <strong>Not Verified</strong> rather than asserted.
        </li>
      </ul>

      <h2>The software</h2>
      <ul>
        <li>
          <strong>Licensing terms: Cannot verify from project files (no LICENSE file present).</strong> The
          project README says only &ldquo;Original code and design built for this project&rdquo; and credits
          the components it uses (RapidOCR/ONNXRuntime, PyMuPDF, python-docx, pdf2docx, Microsoft Word COM).
        </li>
        <li>
          No payment, subscription or licensing code exists in the project files, and the shipped test report
          states that no paid or network service is required — that is why this site describes the product as
          free. Anything beyond those two facts about cost or licence is unverified.
        </li>
        <li>
          Third-party libraries and OCR models keep their own licences, which travel with their own terms —
          not with anything written on this site.
        </li>
      </ul>

      <div className="not-prose my-4">
        <Note icon="info" title="No warranty" tone="amber">
          The software is provided <strong>as it is</strong>. OCR can misread characters, conversions can
          differ from the original layout, and compression, editing and comparison operate on the files you
          give them. No accuracy, fitness or suitability is guaranteed — see the limitation section below.
        </Note>
      </div>

      <h2>Your responsibility for outputs</h2>
      <ul>
        <li>
          <strong>You are responsible for checking what the software produces</strong>, especially anything
          used for legal, medical, financial or official purposes. Verify numbers, names and dates against the
          original document; never rely on OCR output alone.
        </li>
        <li>
          The conversion guide describes how the application validates its own outputs (reopening files,
          checking page counts, opening a workbook in real Excel, re-measuring sizes) and{" "}
          <Link href="/docs/conversion-guide/">how to verify any conversion yourself</Link>. Its validation is
          not a substitute for your review.
        </li>
        <li>
          <strong>Digitally signed PDFs are refused by design</strong> rather than modified: adding content
          would invalidate the signature, and no claim of &ldquo;signature still valid after editing&rdquo; is
          made anywhere on this site.
        </li>
      </ul>

      <h2>External links</h2>
      <p>
        Links to vendor sites (Adobe, Foxit, Tracker Software, PDF24 and others) are provided as{" "}
        <strong>references</strong> for the comparison data. They are not controlled by this project; their
        content, availability and policies are theirs, and their pages were read only on the dates stated.
      </p>

      <h2>Claims and the dates behind them</h2>
      <ul>
        <li>
          Changelog entries carry the date each change was <em>verified</em> on a working installation, from
          1.1.0 (2026-10-03) through 1.7.0 final build (2026-10-11); 1.0.0 is recorded only as
          &ldquo;earlier&rdquo; with no date.
        </li>
        <li>
          Test claims are executions, not intentions: the shipped report is dated <strong>2026-10-05</strong>{" "}
          (40 suites, 1,093 declared checks, all passing), and the regression gate was re-run on{" "}
          <strong>2026-10-17</strong> (43 suites, all passing — the one failure found on the first run of that day, and the fix it led to, are described in the release
        notes).
        </li>
        <li>
          Package hashes, sizes, build dates and the unsigned (NotSigned) signature status were measured on{" "}
          <strong>2026-10-16</strong> and are published on the <Link href="/download/">Download Center</Link>.
        </li>
        <li>
          Everything else on this site that lacks such a source is written as <strong>Not Verified</strong> or{" "}
          <strong>Cannot verify from project files</strong>.
        </li>
      </ul>

      <h2>Trademarks</h2>
      <p>
        Irfan PDF and its icon are this project&rsquo;s own. Adobe, Foxit, Tracker Software, PDF-XChange, PDF24
        and Windows are the property of their respective owners, as are the other product names mentioned.
        Names are used only to refer to the products themselves; no logo or brand asset of a third party is
        republished here as our own.
      </p>

      <h2>Limitation</h2>
      <p>
        In plain language: this website and the software are offered without promise of any particular result.
        Nothing here is legal, financial, medical or professional advice. We do not guarantee that the software
        will meet your requirements, run without interruption, or produce output accurate enough for any
        purpose — OCR recognition errors are expected behaviour of OCR, not a defect claim, and conversion
        layout can differ from the source. To the extent the law allows, responsibility for using the software
        and checking its output stays with the person using it. If a statement on this site turns out to be
        wrong, the correction is that it will be re-verified and restated — the verification dates above say
        when that last happened.
      </p>

      <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        See also: <Link href="/docs/privacy/">Privacy policy</Link> · <Link href="/security/">Security</Link> ·{" "}
        <Link href="/docs/faq/">FAQ</Link> · <Link href="/docs/contact/">Contact &amp; support</Link>
      </p>
    </article>
  );
}
