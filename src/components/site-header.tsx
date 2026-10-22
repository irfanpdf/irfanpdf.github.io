"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MAIN_NAV } from "@/data/site";
import { LogoLink } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-[#0e1016]/85">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <LogoLink />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "bg-zinc-100 text-zinc-950 dark:bg-[#1c1f2b] dark:text-white"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-[#161926] dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/download/" className="btn btn-brand hidden !px-5 !py-2.5 text-sm sm:inline-flex">
            Download
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white lg:hidden dark:border-zinc-700 dark:bg-[#141722]"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="text-xl leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Main mobile"
        hidden={!open}
        className="border-t border-zinc-200 bg-white lg:hidden dark:border-zinc-800 dark:bg-[#0e1016]"
      >
        <ul className="container-page py-3">
          {[...MAIN_NAV, { label: "Download", href: "/download/" }].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={close}
                className="block rounded-lg px-3 py-3 font-semibold text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-[#161926]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
