import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { PageHero, Note, Badge, Section } from "@/components/ui";
import { Icon } from "@/components/icons";
import DownloadCards from "@/components/download-cards";
import { WINDOWS_REQ } from "@/data/downloads";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  ...canonicalFor("/download"),
  title: "Download center",
  description:
    "Official Irfan PDF 1.7.0 packages with version, release date, file size, SHA-256 checksum, installer type, supported Windows versions and digital signature status.",
};

const GUIDES = [
  {
    title: "Installation guide",
    href: "/docs/installation/",
    text: "Requirements, installer steps, portable extraction, first-run health check.",
    icon: "download" as const,
  },
  {
    title: "Update guide",
    href: "/docs/installation/#updating",
    text: "Moving from an earlier version to 1.7.0 without losing your library.",
    icon: "arrowRight" as const,
  },
  {
    title: "Troubleshooting",
    href: "/docs/troubleshooting/",
    text: "Nothing starts, antivirus interference, port conflicts, OCR problems.",
    icon: "wrench" as const,
  },
  {
    title: "Uninstall guide",
    href: "/docs/installation/#uninstalling",
    text: "Remove the app cleanly — and what happens to your data folder.",
    icon: "broom" as const,
  },
];

export default function DownloadPage() {
  return (
    <>
      <PageHero
        eyebrow="Download center"
        title={`Irfan PDF ${SITE.version} for Windows`}
        lede={`${WINDOWS_REQ}. Every package below was hashed and signature-checked on ${SITE.verifiedOn} — the values on this page are measurements, not estimates.`}
      >
        <Badge tone="gray">Free · no account · no telemetry</Badge>
        <Badge tone="green">
          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> SHA-256 measured {SITE.verifiedOn}
        </Badge>
      </PageHero>

      <div className="container-page py-10">
        <div className="mb-6">
          <Note icon="check" title="All three were rebuilt on 2026-10-22 and verified by running them" tone="green">
            The hashes and sizes below were measured on the files as they sit in the release folder today, and each
            one was actually put through its paces: the installer was run silently into a clean folder (self-test{" "}
            <strong>PASS 20 / FAIL 0</strong>, then uninstalled), the Professional package was extracted and
            self-tested with its own bundled runtime, and the source package was extracted and self-tested with the
            PC&rsquo;s Python. Those builds also carry the Stop fix described in the{" "}
            <Link href="/docs/release-notes/#gate">release notes</Link> — Stop is honoured between OCR pages and
            before the output is written, and the PDF AI Analyst&rsquo;s Stop works.
          </Note>
        </div>
        <DownloadCards />

        <div className="mt-10">
          <Note icon="info" title="Verify what you downloaded">
            On Windows you can recompute the hash with PowerShell:{" "}
            <code>Get-FileHash .\IrfanPDF_Setup_1.7.0.exe -Algorithm SHA256</code> and compare it with the value
            above. The installer is an Inno Setup executable and is <strong>not Authenticode-signed</strong> — a
            signature would show as <em>NotSigned</em> even on the genuine file. Code signing is listed as a planned
            item, not a present one.
          </Note>
        </div>
      </div>

      <Section title="Guides" lede="Everything needed to install, update and remove the application.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.map((g) => (
            <Link key={g.href} href={g.href} className="card block p-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Icon name={g.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold text-zinc-950 dark:text-white">{g.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{g.text}</p>
              <span className="mt-3 inline-block text-sm font-semibold text-brand dark:text-[#ff6b6b]">Open →</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-[#11131c]">
          <h2 className="text-lg font-extrabold text-zinc-950 dark:text-white">Supported Windows versions</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>• {WINDOWS_REQ}</li>
            <li>• No Python, no pip, no internet connection, no account, no cloud service required</li>
            <li>• About 400 MB of disk for the self-contained packages (measured 365.6 MiB expanded, of which the bundled runtime is 355.8 MiB)</li>
            <li>• Per-user install: no administrator rights needed for the EXE installer</li>
          </ul>
          <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
            Source: dist\IRFAN-PDF\INSTALLATION-GUIDE.md and installer\irfan_pdf.iss (ArchitecturesInstallIn64BitMode
            = x64compatible, PrivilegesRequired=lowest). Sizes measured from the package itself on 2026-10-22; the
            installer declares no minimum Windows version of its own.
          </p>
        </div>
      </Section>
    </>
  );
}
