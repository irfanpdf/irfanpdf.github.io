import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import Link from "next/link";
import { DOCS_NAV } from "@/data/site";

export const metadata: Metadata = {
  ...canonicalFor("/docs"),
  title: "Documentation",
  description:
    "Irfan PDF documentation: installation, OCR guide, conversion guide, troubleshooting, FAQ, release notes, privacy policy and terms.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[16rem_1fr]">
      <nav aria-label="Documentation" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
          Documentation
        </p>
        <ul className="flex flex-wrap gap-2 lg:block lg:space-y-1">
          {DOCS_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-[#161926] dark:hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-[#141722] dark:text-zinc-400">
          All documentation here describes version <strong>1.7.0</strong> as shipped. If a capability is not in the
          Features list, treat it as absent.
        </div>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
