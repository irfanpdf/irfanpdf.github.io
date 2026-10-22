import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { PageHero, Section, Badge, Note } from "@/components/ui";
import { Icon } from "@/components/icons";
import { FEATURE_GROUPS, FEATURE_COUNT } from "@/data/features";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  ...canonicalFor("/features"),
  title: "Features",
  description:
    "Verified features of Irfan PDF: viewing, editing, searchable and editable OCR, conversions, compression, page organisation, security, batch, search, compare, print and local document AI.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Only what the build can actually do"
        lede={`${FEATURE_COUNT} verified capabilities across ${FEATURE_GROUPS.length} groups. Every item is backed by the shipped test suite — features we could not confirm are simply not listed.`}
      >
        <Badge tone="green">
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
          Gate run {SITE.gateRunOn}: {SITE.gateResult}
        </Badge>
      </PageHero>

      <div className="mx-auto max-w-5xl space-y-4 px-5 py-8">
        <Note icon="info" title="How to read this page">
          Each card describes shipped behaviour in plain words. Where a limit exists (for example OCR languages, or
          what happens to digitally signed files) it is stated on the card instead of being hidden.
        </Note>
        <Note icon="check" title="The Stop fix described below is in the published packages" tone="green">
          <strong>Stop and retry</strong> says Stop is honoured between OCR pages and before the output is written.
          That behaviour was missing from the 2026-10-14 builds, was fixed on 2026-10-17, and all three packages were
          rebuilt after the fix (2026-10-22) — so the files on the{" "}
          <Link href="/download/" className="font-semibold underline underline-offset-4">
            Download Center
          </Link>{" "}
          really do it. It was found by the regression gate, then re-measured on the installed copy and on the
          extracted packages: cancelling a 12-page scan mid-document ends the job as cancelled with no output file.{" "}
          <Link href="/docs/release-notes/#gate" className="font-semibold underline underline-offset-4">
            The full story
          </Link>
          .
        </Note>
      </div>

      {FEATURE_GROUPS.map((g, gi) => (
        <section
          key={g.id}
          id={g.id}
          aria-labelledby={`g-${g.id}`}
          className={
            gi % 2 === 1
              ? "border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#11131c]"
              : ""
          }
        >
          <div className="container-page py-12">
            <div className="flex flex-wrap items-baseline gap-4">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: g.color }}
                aria-hidden="true"
              >
                <Icon name={g.items[0].icon} className="h-5 w-5" />
              </span>
              <h2 id={`g-${g.id}`} className="text-2xl font-extrabold tracking-tight text-zinc-950 md:text-3xl dark:text-white">
                {g.title}
              </h2>
              <p className="w-full text-zinc-600 dark:text-zinc-400 md:w-auto md:flex-1">{g.summary}</p>
            </div>

            <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((item) => (
                <li key={item.title} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: g.color }}
                      aria-hidden="true"
                    >
                      <Icon name={item.icon} className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="font-bold text-zinc-950 dark:text-white">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item.blurb}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <Section>
        <Note icon="alert" title="Not verified — and therefore not advertised">
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>OCR languages other than the bundled English PP-OCRv5 model.</li>
            <li>The Tesseract backend (code path exists; no Tesseract ships in the package).</li>
            <li>The Word→PDF fallback converter when Microsoft Word is absent (the Word path is what was exercised).</li>
            <li>Any “cloud”, “sync”, “mobile” or “web app” version — Irfan PDF is a Windows desktop application.</li>
          </ul>
        </Note>
      </Section>
    </>
  );
}
