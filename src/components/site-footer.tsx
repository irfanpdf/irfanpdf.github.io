import Link from "next/link";
import { Logo } from "@/components/logo";
import { SITE } from "@/data/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features/" },
      { label: "How it works", href: "/how-it-works/" },
      { label: "Use cases", href: "/use-cases/" },
      { label: "Compare PDF tools", href: "/compare/" },
      { label: "Download", href: "/download/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs/" },
      { label: "Installation guide", href: "/docs/installation/" },
      { label: "OCR guide", href: "/docs/ocr-guide/" },
      { label: "Troubleshooting", href: "/docs/troubleshooting/" },
      { label: "Release notes", href: "/docs/release-notes/" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security & privacy", href: "/security/" },
      { label: "Privacy policy", href: "/docs/privacy/" },
      { label: "Terms of use", href: "/docs/terms/" },
      { label: "FAQ", href: "/docs/faq/" },
      { label: "Contact & support", href: "/docs/contact/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-[#0b0d13]">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            A local-first PDF and OCR workstation for Windows. Documents are
            processed on your own machine — nothing is uploaded, ever.
          </p>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            Version {SITE.version} · {SITE.os.split(",")[0]}
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {col.title}
            </h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-zinc-600 underline-offset-4 hover:text-brand hover:underline dark:text-zinc-400 dark:hover:text-[#ff6b6b]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-zinc-200 py-6 dark:border-zinc-800">
        <div className="container-page flex flex-col gap-2 text-xs text-zinc-600 dark:text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.publisher}. Irfan PDF is a
            Windows desktop application; this site is information only.
          </p>
          <p>
            Claims checked against the shipped test suite: regression gate run {SITE.gateRunOn} —{" "}
            {SITE.gateResult} (see{" "}
            <Link href="/docs/release-notes/#gate" className="underline underline-offset-4">
              release notes
            </Link>
            ).
          </p>
        </div>
      </div>
    </footer>
  );
}
