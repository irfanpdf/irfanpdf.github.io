/* Post-deployment check: verify a live (or local) URL really sends the security
 * headers that `out/_headers` declares.
 *
 *   node scripts/check-live-headers.mjs http://127.0.0.1:8124
 *   node scripts/check-live-headers.mjs https://irfanpdf.pages.dev
 *
 * Checks, per route:
 *   - the required headers are present (and the two that have expected values)
 *   - a REAL route carries the strict CSP tier (at least one sha256- hash) —
 *     this is the check that would have caught Cloudflare dropping an
 *     over-length line
 *   - an UNMATCHED path still gets a CSP (catch-all rule) and returns 404, and
 *     that catch-all must be **hash-constrained (strong mode: sha256- hashes,
 *     no 'unsafe-inline')** — this is the check that asserts residual §6.9 is
 *     closed. gen-headers falls back to 'unsafe-inline' when a platform's hash
 *     union exceeds Cloudflare's 2,000-char line limit (Windows builds do, the
 *     deployed Linux build does not); pass `--allow-fallback` to accept that
 *     mode deliberately, otherwise a fallback is reported as a FAILURE so a
 *     live regression cannot slip through unnoticed
 *   - `/_headers` itself is not served as an asset (Cloudflare behaviour)
 *
 * Usage:
 *   node scripts/check-live-headers.mjs <base-url> [--allow-fallback]
 *
 * Exit code 0 = everything passed, 1 = at least one check failed.
 */
const BASE = (process.argv[2] || "").replace(/\/+$/, "");
if (!BASE) {
  console.error("usage: node scripts/check-live-headers.mjs <base-url> [--allow-fallback]");
  process.exit(2);
}
const ALLOW_FALLBACK = process.argv.includes("--allow-fallback");

const REQUIRED = [
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
];

const EXPECTED = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
};

const ROUTES = ["/", "/download/", "/docs/", "/features/", "/security/", "/docs/faq/"];
const BOGUS = "/this-route-should-not-exist-9f2c/";

let failures = 0;
const say = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

async function checkRoute(pathname, { expectStatus, expectStrictCsp }) {
  let res;
  try {
    res = await fetch(BASE + pathname, { redirect: "manual" });
  } catch (e) {
    say(false, `${pathname} reachable`, String(e.message || e));
    return;
  }
  const status = res.status;
  if (expectStatus === "any") say(true, `${pathname} status`, String(status));
  else say(status === expectStatus, `${pathname} status`, `${status} (expected ${expectStatus})`);

  for (const h of REQUIRED) {
    const v = res.headers.get(h);
    if (expectStrictCsp === null && h === "content-security-policy") {
      say(true, `${pathname} ${h}`, v ? "present" : "absent (allowed here)");
      continue;
    }
    say(Boolean(v), `${pathname} ${h}`, v ? "" : "MISSING");
    if (v && EXPECTED[h]) {
      const got = v.split(",")[0].trim();
      say(got === EXPECTED[h], `${pathname} ${h} value`, `${got} (expected ${EXPECTED[h]})`);
    }
  }

  const csp = res.headers.get("content-security-policy") || "";
  if (expectStrictCsp === true) {
    say(/sha256-/.test(csp), `${pathname} strict CSP tier`, `${(csp.match(/sha256-/g) || []).length} hash(es)`);
    say(/frame-ancestors 'none'/.test(csp), `${pathname} frame-ancestors 'none'`);
    say(/object-src 'none'/.test(csp), `${pathname} object-src 'none'`);
  } else if (expectStrictCsp === false) {
    say(Boolean(csp), `${pathname} catch-all CSP`, csp ? `${csp.length} chars` : "MISSING");
    // Scope 'unsafe-inline' to the SCRIPT directive only: style-src-attr
    // 'unsafe-inline' is by design and present in every tier, so a plain
    // /unsafe-inline/ test would always match and mask the real mode.
    const hashes = (csp.match(/sha256-/g) || []).length;
    const scriptAllowsInline = /(?:^|[;,])\s*script-src\s[^;,]*'unsafe-inline'/.test(csp);
    const strong = hashes > 0 && !scriptAllowsInline;
    const fallback = hashes === 0 && scriptAllowsInline;
    if (strong) {
      say(true, `${pathname} catch-all is hash-constrained (strong)`, `${hashes} hash(es), no script-src unsafe-inline`);
    } else if (fallback) {
      say(
        ALLOW_FALLBACK,
        `${pathname} catch-all is hash-constrained`,
        ALLOW_FALLBACK
          ? "FALLBACK mode accepted (--allow-fallback): 'unsafe-inline', residual §6.9 open here"
          : "FALLBACK: 'unsafe-inline' and no hashes — residual §6.9 OPEN (re-run with --allow-fallback to accept)"
      );
    } else {
      say(false, `${pathname} catch-all is hash-constrained`, `unexpected CSP shape (${hashes} hash(es))`);
    }
  }
}

async function main() {
  console.log(`check-live-headers: ${BASE}\n`);

  for (const r of ROUTES) await checkRoute(r, { expectStatus: 200, expectStrictCsp: true });

  // Unmatched URL: 404, but still behind the catch-all policy.
  await checkRoute(BOGUS, { expectStatus: 404, expectStrictCsp: false });

  // The header file itself must never be downloadable.
  const h = await fetch(BASE + "/_headers").catch(() => null);
  say(!h || h.status === 404, "/_headers is not served", h ? String(h.status) : "no response");

  console.log(
    failures === 0
      ? "\nOVERALL: PASS — every required header present on every route checked"
      : `\nOVERALL: FAIL — ${failures} check(s) failed`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
