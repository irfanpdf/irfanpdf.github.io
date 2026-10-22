import type { Metadata } from "next";
import Link from "next/link";
import { canonicalFor } from "@/data/env";
import { CtaRow, Section, Badge, Stat, ToolCard, Note, CheckList } from "@/components/ui";
import { Icon } from "@/components/icons";
import { FEATURE_GROUPS, FEATURE_COUNT } from "@/data/features";
import { SITE } from "@/data/site";
import { ARTIFACTS } from "@/data/downloads";
import { CURRENT, PLANNED } from "@/data/roadmap";
import { SHOTS } from "@/data/screenshots";

export const metadata: Metadata = { ...canonicalFor("/") };

const BENEFITS = [
  {
    icon: "offline" as const,
    title: "Nothing leaves your PC",
    text: "The server listens on 127.0.0.1 only. There is no upload, no account, no telemetry and no analytics code in the product.",
  },
  {
    icon: "check" as const,
    title: "Results are proven, not promised",
    text: "Compression sizes are re-measured, redactions are re-read, Excel files are opened and checked — the app verifies its own output.",
  },
  {
    icon: "pen" as const,
    title: "Documents keep their look",
    text: "Edits reuse the document's own embedded fonts; OCR covers are fitted to the ink so tables and borders survive untouched.",
  },
  {
    icon: "spark" as const,
    title: "Analysis you can trace",
    text: "The local AI Assistant only shows sentences that were re-read from your file — quoted, page-scoped, and confirmed before display.",
  },
];

const WORKFLOW = [
  { step: "1", title: "Open the app", text: "Installer shortcuts, .pdf association or the portable START-APPLICATION script — no Python, no internet." },
  { step: "2", title: "Drop your file", text: "Drag a PDF anywhere onto the dashboard. Scans are auto-rotated and auto-straightened on upload." },
  { step: "3", title: "Pick the job", text: "OCR, convert, edit, compress, organise, secure or print — every tool follows the same pick → set → run pattern." },
  { step: "4", title: "Review the result", text: "The outcome card states exactly what changed (size before/after, pages touched, warnings). Nothing claims success it did not check." },
  { step: "5", title: "Save or open", text: "Download, open the output folder or reveal it in Explorer — the original file is never overwritten behind your back." },
];

const USE_CASES = [
  { icon: "users" as const, color: "#8b5cf6", title: "Office work", text: "Edit contracts, fill scanned forms, add signatures, merge packets and print with page numbers." },
  { icon: "text" as const, color: "#10b981", title: "Students & research", text: "Turn lecture scans into searchable text, extract quotes, convert readings to Word for notes." },
  { icon: "fileSpreadsheet" as const, color: "#f59e0b", title: "Accounting & finance", text: "Extract tables to real Excel, batch-compress statements, search amounts across the library." },
  { icon: "shield" as const, color: "#ef4444", title: "Compliance & legal", text: "Password-protect with AES-256, permanently redact, compare revisions, keep everything offline." },
  { icon: "layers" as const, color: "#d946ef", title: "Document teams", text: "Run watermark/compress/rotate jobs across up to 200 files with a CSV report and retry for failures." },
  { icon: "terminal" as const, color: "#0ea5e9", title: "IT administrators", text: "Per-user install without admin rights, self-contained portable package, health check for support." },
];

const FAQ_PREVIEW = [
  {
    q: "Does Irfan PDF upload my documents?",
    a: "No. The application binds to 127.0.0.1 on your machine; no HTTP client, telemetry or analytics exists in the code.",
    href: "/docs/privacy/",
  },
  {
    q: "Do I need Python or internet to install it?",
    a: "No. The installer and the Professional package carry their own Python runtime — Windows 10/11 64-bit is the only requirement.",
    href: "/docs/installation/",
  },
  {
    q: "Will OCR change how my document looks?",
    a: "Searchable OCR keeps the original appearance (invisible text layer). Editable OCR may re-lay-out glyphs it covers — both are documented with their limits.",
    href: "/docs/ocr-guide/",
  },
  {
    q: "What happens to digitally signed PDFs?",
    a: "They are refused with an explanation instead of being modified — adding a text layer would invalidate the signature.",
    href: "/docs/faq/",
  },
];

export default function HomePage() {
  const installer = ARTIFACTS[0];
  const professional = ARTIFACTS[1];

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90rem_40rem_at_85%_-10%,rgb(255_0_0/0.09),transparent_60%)] dark:bg-[radial-gradient(90rem_40rem_at_85%_-10%,rgb(255_0_0/0.16),transparent_60%)]"
        />
        <div className="container-page relative py-16 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <Badge tone="red">
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                Version {SITE.version} · fully offline for Windows
              </Badge>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-zinc-950 md:text-6xl dark:text-white">
                Your Documents.
                <br />
                <span className="bg-gradient-to-r from-brand-bright to-brand bg-clip-text text-transparent">
                  Your Control.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 md:text-xl dark:text-zinc-300">
                {SITE.subtitle}
              </p>
              <div className="mt-8">
                <CtaRow />
              </div>
              <dl className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-center">
                <Stat value={`${SITE.gateSuitesPassed}`} label={`of ${SITE.gateSuites} suites passing (gate run ${SITE.gateRunOn})`} />
                <Stat value={`${FEATURE_COUNT}+`} label="verified features on this site" />
                <Stat value="0" label="bytes ever uploaded" />
              </dl>
            </div>

            <figure className="relative">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-900/15 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SHOTS.home.src}
                  alt={SHOTS.home.alt}
                  width={SHOTS.home.width}
                  height={SHOTS.home.height}
                  className="h-auto w-full"
                  loading="eager"
                />
              </div>
              <figcaption className="mt-3 text-center text-xs text-zinc-600 dark:text-zinc-400">
                {SHOTS.home.caption} Real capture from the running application.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- feature highlights */}
      <Section
        title="Everything a PDF job needs — in one window"
        lede={`Each capability below exists in the shipped build and is exercised by the ${SITE.gateSuites}-suite regression gate (latest run ${SITE.gateRunOn}: ${SITE.gateResult}). Nothing here is a mock-up.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_GROUPS.slice(0, 6).map((g) => (
            <ToolCard key={g.id} title={g.title} blurb={g.summary} icon={g.items[0].icon} color={g.color} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/features/" className="btn btn-ghost">
            Explore all features <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* ------------------------------------------------------------- benefits */}
      <div className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#11131c]">
        <Section title="Why people keep it installed" lede="A practical tool earns trust by never lying about what it did.">
          <div className="grid gap-5 md:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card flex gap-4 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <Icon name={b.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-zinc-950 dark:text-white">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ----------------------------------------------------------- workflow */}
      <Section title="How it works" lede="Five steps, the same every time — no hidden dialogs.">
        <ol className="grid gap-4 md:grid-cols-5">
          {WORKFLOW.map((w) => (
            <li key={w.step} className="card p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                {w.step}
              </span>
              <h3 className="mt-3 font-bold text-zinc-950 dark:text-white">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{w.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link href="/how-it-works/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline dark:text-[#ff6b6b]">
            See the detailed workflows →
          </Link>
        </div>
      </Section>

      {/* --------------------------------------------------------- use cases */}
      <div className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#11131c]">
        <Section title="Built for real document work" lede="Every use case maps to a capability that is tested in the shipped suite.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => (
              <ToolCard key={u.title} title={u.title} blurb={u.text} icon={u.icon} color={u.color} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/use-cases/" className="text-sm font-semibold text-brand underline-offset-4 hover:underline dark:text-[#ff6b6b]">
              All use cases →
            </Link>
          </div>
        </Section>
      </div>

      {/* ------------------------------------------------------- screenshots */}
      <Section title="The actual application" lede="Captures taken from the running build — no marketing mock-ups.">
        <div className="grid gap-5 md:grid-cols-2">
          {[SHOTS.editor, SHOTS.files].map((s) => (
            <figure key={s.src} className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} width={s.width} height={s.height} className="h-auto w-full" loading="lazy" />
              <figcaption className="border-t border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-[#141722] dark:text-zinc-400">
                {s.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- latest release */}
      <div className="border-y border-zinc-200 bg-zinc-950 text-zinc-100 dark:border-zinc-800">
        <Section tone="dark" title="Latest release" lede={`Version ${SITE.version} — printing, the professional distributable and the PDF AI Analyst.`}>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="red">v{SITE.version}</Badge>
                <span className="text-sm text-zinc-400">
                  Release {SITE.releaseDate} · packages {SITE.packageDate}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {[
                  "Real print: page ranges, N-up, true paper size, Windows hand-over",
                  "PDF AI Analyst: classification, automatic OCR, A-X cited analysis, Office exports",
                  "Font preservation when editing existing text",
                  "Self-contained package: bundled Python runtime in installer and ZIP",
                  "Batch retry of just the failed documents, Show-in-folder actions",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.6} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-zinc-400">
                Source: CHANGELOG.md (1.7.0 final build — {SITE.releaseDate}).
              </p>
              <div className="mt-5">
                <Link href="/docs/release-notes/" className="text-sm font-semibold text-[#ff6b6b] underline-offset-4 hover:underline">
                  Full release notes →
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <h3 className="font-bold text-white">Download section</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Verified packages (SHA-256 published on the Download Center):
              </p>
              <div className="mt-4 space-y-3">
                {ARTIFACTS.filter((a) => a.verified).map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">{a.label}</p>
                      <p className="text-xs text-zinc-400">
                        {a.filename} · {a.mib}
                      </p>
                    </div>
                    <Icon name={a.kind === "installer" ? "download" : "files"} className="h-5 w-5 shrink-0 text-zinc-400" />
                  </div>
                ))}
              </div>
              <Link href="/download/" className="btn btn-brand mt-5 w-full">
                <Icon name="download" className="h-5 w-5" /> Go to Download Center
              </Link>
            </div>
          </div>
        </Section>
      </div>

      {/* ------------------------------------------- system requirements + roadmap */}
      <Section title="System requirements" lede="Exactly what the installation guide states — nothing else to install.">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Requirements</h3>
            <div className="mt-4">
              <CheckList
                items={[
                  `Operating system: ${SITE.os}`,
                  "Disk: about 400 MB for the self-contained packages (bundled runtime ≈ 350 MB)",
                  "No Python, no pip, no internet connection, no account, no cloud service",
                  `Installer (${installer.mib}) or Professional package (${professional.mib}) carry their own runtime`,
                ]}
              />
            </div>
            <div className="mt-5">
              <Note icon="info" title="Source package, if you already have Python">
                The small <code>IrfanPDF_Portable.zip</code> is the application sources: it bundles no Python, so it
                needs the PC&rsquo;s own Python 3.10+ and one <code>pip install -r requirements.txt</code> (its README
                says so, and the launcher is in the folder root). Use the installer or the Professional package unless
                you specifically want the sources.{" "}
                <Link href="/download/" className="font-semibold underline">
                  Details on the Download Center
                </Link>
                .
              </Note>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-zinc-950 dark:text-white">Roadmap</h3>
              <Badge tone="gray">Planned items are not shipped</Badge>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Current features (verified)
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                {CURRENT.slice(0, 4).map((c) => (
                  <li key={c.title} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.6} />
                    {c.title}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Planned / future
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                {PLANNED.slice(0, 4).map((p) => (
                  <li key={p.title} className="flex gap-2">
                    <Icon name="arrowRight" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    {p.title}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-5 text-xs text-zinc-600 dark:text-zinc-400">
              Nothing in the “planned” list exists today. See the roadmap page for the full separated lists.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------------- FAQ preview */}
      <div className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#11131c]">
        <Section title="FAQ preview" lede="The four questions people ask before downloading.">
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQ_PREVIEW.map((f) => (
              <details key={f.q} className="card group p-5">
                <summary className="cursor-pointer list-none font-bold text-zinc-950 marker:hidden dark:text-white">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-zinc-400 transition group-open:rotate-90" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p>
                <Link href={f.href} className="mt-2 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline dark:text-[#ff6b6b]">
                  Read more →
                </Link>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/docs/faq/" className="btn btn-ghost">
              All questions
            </Link>
          </div>
        </Section>
      </div>
    </>
  );
}
