"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Client-side navigation does not jump to `#fragment` on its own: the browser
 * only does that for a real document load, so a link like
 * `/docs/release-notes/#gate` lands at the top of the page. This scrolls the
 * target into view on every navigation that carries a hash.
 */
export function HashScroller() {
  const pathname = usePathname();

  useEffect(() => {
    const jump = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const el = document.getElementById(decodeURIComponent(hash));
      el?.scrollIntoView({ block: "start" });
    };
    jump();
    window.addEventListener("hashchange", jump);
    return () => window.removeEventListener("hashchange", jump);
  }, [pathname]);

  return null;
}
