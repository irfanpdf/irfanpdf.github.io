import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
        <Icon name="search" className="h-8 w-8" />
      </span>
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950 md:text-4xl dark:text-white">
        This page is not in the document
      </h1>
      <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-300">
        The address you followed does not match any page on this site. Nothing was lost — try one of the routes
        below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" /> Back to home
        </Link>
        <Link href="/docs/" className="btn btn-ghost">
          Documentation
        </Link>
        <Link href="/download/" className="btn btn-ghost">
          Download center
        </Link>
      </div>
    </div>
  );
}
