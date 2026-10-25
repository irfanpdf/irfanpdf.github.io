/* Post-build: generate `out/_headers` — the security-header file read by hosts
 * that support real response headers (Cloudflare Pages and Netlify both read
 * `/_headers` from the site root).
 *
 * Why this exists:
 *   GitHub Pages cannot set custom response headers at all, and `next.config.ts`
 *   `headers()` does nothing for `output: "export"` (there is no server to run
 *   it). So the policy lives here, generated from the actual exported bytes.
 *
 * Why hashes:
 *   A static export ships inline <script> elements (the theme bootstrap, Next's
 *   hydration payloads). Allowing them with 'unsafe-inline' would make the CSP
 *   useless against exactly the attack it exists to stop — injected inline
 *   script. Instead every inline script actually present in `out/**.html` is
 *   hashed (SHA-256, base64) and the CSP allows those hashes by value, so a new
 *   inline script of any other content is blocked.
 *
 * Why TWO tiers of CSP (since the Cloudflare Pages migration prep, 2026-10-25):
 *   Cloudflare documents two hard limits for `_headers`: 100 rules per file and
 *   **2,000 characters per line**, counting indentation and the header name. A
 *   single `/*` policy carrying the union of all hashes is 2,516 chars on a
 *   Windows build — over the limit, and a line the host drops is a line the
 *   site never gets. So the file carries:
 *     `/*`              → all the non-CSP headers + a catch-all CSP. It carries
 *                         the UNION of every hash when that fits the 2,000-char
 *                         line (strong mode — the deployed Linux build fits,
 *                         measured ~1,491 chars), which closes residual §6.9:
 *                         an unmatched URL receives only this rule, yet its
 *                         404 page is still hash-constrained. When the union
 *                         does not fit (Windows builds, which split the RSC
 *                         payload into more inline scripts), it falls back to
 *                         'unsafe-inline' and prints a loud WARNING naming the
 *                         residual as open for that build.
 *     one rule per page → the STRICT CSP with exactly that page's hashes.
 *
 *   A real page matches both rules and gets two policies, which browsers
 *   intersect (AND): a script must pass the catch-all AND the strict policy,
 *   so the effective script rule on a real page is the strict one. This is why
 *   the catch-all must carry the whole union rather than just the 404's hashes
 *   — it applies to real pages too, and a hash it lacks would block their
 *   inline scripts. Verified empirically in a real browser before this was
 *   written — a single header value containing "policyA, policyB" enforced
 *   exactly as two policies (the unhashed control script was blocked, the
 *   hashed one ran), which is what Cloudflare's "values are joined with a
 *   comma separator" produces.
 *
 * Fail-closed: exits non-zero if
 *   - no HTML is found,
 *   - no executable inline script can be hashed,
 *   - any emitted line exceeds the 2,000-char Cloudflare limit,
 *   - the rule count exceeds Cloudflare's 100-rule limit.
 * The build fails rather than shipping a policy a real host would silently drop.
 *
 * Run automatically by `npm run build` (after scripts/flatten-rsc.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const OUT = path.join(process.cwd(), "out");
const HEADERS_FILE = path.join(OUT, "_headers");

// Cloudflare Pages limits, from developers.cloudflare.com/pages/platform/headers/
const MAX_LINE = 2000;
const MAX_RULES = 100;

if (!fs.existsSync(OUT)) {
  console.error("gen-headers: out/ does not exist — run `next build` first");
  process.exit(1);
}

/** Every .html file under out/. */
function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (entry.name.toLowerCase().endsWith(".html")) acc.push(p);
  }
  return acc;
}

const EXEC_TYPES = new Set([
  "text/javascript",
  "application/javascript",
  "application/ecmascript",
  "text/ecmascript",
  "module",
]);

/** Inline, executable <script> bodies in one HTML file. */
function inlineExecutableScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || "";
    const body = m[2];
    if (/\ssrc\s*=/i.test(attrs)) continue; // external: covered by 'self'
    const typeMatch = attrs.match(/\stype\s*=\s*["']([^"']*)["']/i);
    if (typeMatch) {
      const t = typeMatch[1].trim().toLowerCase();
      // JSON-LD / importmap / speculationrules etc. are NOT executable
      if (!EXEC_TYPES.has(t)) continue;
    }
    if (body.length === 0) continue;
    out.push(body);
  }
  return out;
}

/** URL patterns a given exported file answers to on a static host. */
function urlPatterns(rel) {
  if (rel === "index.html") return ["/", "/index.html"];
  if (rel.endsWith(`${path.sep}index.html`) || rel.endsWith("/index.html")) {
    const dir = "/" + rel.slice(0, -"/index.html".length).replace(/\\/g, "/");
    return [`${dir}/`, dir, `${dir}/index.html`];
  }
  return ["/" + rel.replace(/\\/g, "/")];
}

const files = walk(OUT);
if (files.length === 0) {
  console.error("gen-headers: no HTML found under out/ — refusing to write a policy");
  process.exit(1);
}

const union = new Set();
const pages = [];
let scriptCount = 0;

for (const f of files) {
  const rel = path.relative(OUT, f);
  const html = fs.readFileSync(f, "utf8");
  const hashes = new Set();
  for (const body of inlineExecutableScripts(html)) {
    scriptCount++;
    const digest = crypto.createHash("sha256").update(body, "utf8").digest("base64");
    const h = `'sha256-${digest}'`;
    hashes.add(h);
    union.add(h);
  }
  if (hashes.size === 0) {
    console.error(
      `gen-headers: ${rel} has no executable inline scripts — its strict policy ` +
        `would be built from an empty set. Refusing (the HTML shape changed).`
    );
    process.exit(1);
  }
  pages.push({ rel, patterns: urlPatterns(rel), hashes });
}

if (union.size === 0) {
  console.error(
    "gen-headers: no executable inline scripts hashed — the CSP would be built " +
      "from an empty set. Refusing (this usually means the HTML shape changed)."
  );
  process.exit(1);
}

// -------------------------------------------------------------------------
// The directive set. default-src 'none' first: every fetch mode must be named,
// so a future dependency cannot quietly start loading something unplanned.
// -------------------------------------------------------------------------
function csp(scriptSrc) {
  return [
    "default-src 'none'",
    `script-src ${scriptSrc}`,
    "style-src 'self'",
    // React renders style *attributes* (theme color-scheme, per-card brand
    // colours, Next's route announcer). Hashes cannot cover them: they are
    // generated at runtime and differ per element. Measured in-browser: 14 such
    // elements, zero inline <style> tags, one external stylesheet. Restricting
    // *stylesheets* to 'self' while allowing attributes keeps injected
    // stylesheets/scripts blocked; see docs/SECURITY-HARDENING.md for the
    // residual risk this trades away.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "media-src 'self'",
    "worker-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const OTHER_HEADERS = [
  "X-Content-Type-Options: nosniff",
  "X-Frame-Options: DENY",
  "Referrer-Policy: strict-origin-when-cross-origin",
  "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy: same-origin",
  "Cross-Origin-Resource-Policy: same-origin",
  "X-Permitted-Cross-Domain-Policies: none",
  "Strict-Transport-Security: max-age=31536000; includeSubDomains",
];

// --- Tier 1: the catch-all ---------------------------------------------------
// The catch-all applies to EVERY URL, matched or not, and an unmatched URL
// receives ONLY this rule — so its script-src must do two jobs at once:
//   1. allow the 404 page's own inline scripts (closing residual §6.9: the
//      404 must be hash-constrained, not 'unsafe-inline'), and
//   2. allow every real page's inline scripts too, because this rule is
//      comma-joined with each strict per-page rule (a script must pass BOTH
//      policies, so the catch-all cannot list only the 404's hashes).
// Hence: the union of every hash in the export — the same union that the
// pre-two-tier single policy carried. Whether it fits is platform-dependent
// (measured 2026-10-25: Linux build 21 hashes ≈ 1,491-char line, fits;
// Windows build 40 hashes ≈ 2,517-char line, does not — Next splits the RSC
// payload into more inline scripts on Windows, see SECURITY-HARDENING §5.5).
//
// Fallback, chosen rather than fatal: if the union line would exceed
// Cloudflare's 2,000-char limit, emit the old 'unsafe-inline' fallback and
// say so loudly in the build log. A weak-but-honest catch-all still ships all
// the other headers and keeps local Windows builds deployable; a line the
// host would silently drop would ship NO policy at all. scripts/check-live-headers.mjs
// reports the mode it finds, so a live regression to fallback is visible.
const strongSrc = ["'self'", ...[...union].sort()].join(" ");
const strongLine = `  Content-Security-Policy: ${csp(strongSrc)}`;
const catchAllMode = strongLine.length <= MAX_LINE ? "strong" : "fallback";
const catchAllCsp =
  catchAllMode === "strong" ? strongLine.trim() : `Content-Security-Policy: ${csp("'self' 'unsafe-inline'")}`;

const blocks = [];
blocks.push(["/*", [catchAllCsp, ...OTHER_HEADERS]]);

// --- Tier 2: one strict rule per exported page. ---------------------------
for (const p of pages) {
  const line = `Content-Security-Policy: ${csp(["'self'", ...[...p.hashes].sort()].join(" "))}`;
  for (const pattern of p.patterns) blocks.push([pattern, [line]]);
}

// --- Fail-closed checks against the host's documented limits. --------------
const lines = [];
for (const [pattern, headers] of blocks) {
  lines.push(pattern);
  for (const h of headers) lines.push(`  ${h}`);
}
lines.push("");

const over = lines.filter((l) => l.length > MAX_LINE);
if (over.length > 0) {
  console.error(
    `gen-headers: ${over.length} line(s) exceed Cloudflare's ${MAX_LINE}-char limit — ` +
      `a real host would drop them and the site would ship without those headers. ` +
      `Longest = ${Math.max(...lines.map((l) => l.length))} chars. Refusing to write.`
  );
  process.exit(1);
}
if (blocks.length > MAX_RULES) {
  console.error(
    `gen-headers: ${blocks.length} header rules exceed Cloudflare's ${MAX_RULES}-rule ` +
      `limit for the _headers file. Refusing to write.`
  );
  process.exit(1);
}

fs.writeFileSync(HEADERS_FILE, lines.join("\n"), "utf8");

const strictLines = blocks.slice(1).map(([, h]) => `  ${h[0]}`.length);
console.log(
  `gen-headers: scanned ${files.length} HTML file(s), ${scriptCount} inline ` +
    `executable script(s) -> ${union.size} unique SHA-256 hash(es)`
);
console.log(`gen-headers: wrote ${path.relative(process.cwd(), HEADERS_FILE)}`);
console.log(
  `gen-headers: ${blocks.length} rules (1 catch-all + ${blocks.length - 1} strict ` +
    `per-page) / limit ${MAX_RULES}; longest line ${Math.max(...lines.map((l) => l.length))} ` +
    `chars / limit ${MAX_LINE}`
);
console.log(
  `gen-headers: catch-all CSP = ${catchAllCsp.replace(/^Content-Security-Policy: /, "").length} chars ` +
    `(${catchAllMode === "strong" ? `strong: ${union.size} hashes, no unsafe-inline` : "FALLBACK: 'unsafe-inline'"}); ` +
    `strict CSP per page = ${Math.min(...strictLines)}–${Math.max(...strictLines)} chars`
);
if (catchAllMode === "fallback") {
  console.warn(
    `gen-headers: WARNING — the hash union needs a ${strongLine.length}-char catch-all line, over ` +
      `Cloudflare's ${MAX_LINE}-char limit, so this build fell back to 'unsafe-inline' in the ` +
      `catch-all. Real pages stay hash-constrained by their strict per-page rules, but an ` +
      `unmatched URL (the 404) does NOT (residual §6.9 open for this build). The build that ` +
      `deploys from Linux fits (21 hashes in the last Linux build ≈ 1,491-char line); local ` +
      `Windows builds do not (40 hashes = ${strongLine.length} chars).`
  );
}
