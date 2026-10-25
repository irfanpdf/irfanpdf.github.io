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
 *   single `/*` policy carrying the union of all 40 hashes is 2,516 chars — it
 *   would be dropped, and the site would ship with NO CSP at all. Measured:
 *   the union needs 40 hashes but only 29 fit, while any single page needs
 *   just 4–9 (567–852 chars).
 *
 *   So the file now carries:
 *     `/*`              → all the non-CSP headers + a FALLBACK CSP whose
 *                         script-src allows 'self' and 'unsafe-inline'.
 *                         This is what an unmatched URL (a 404) receives —
 *                         it still enforces object/base-uri/frame-ancestors.
 *     one rule per page → the STRICT CSP with exactly that page's hashes.
 *
 *   A real page therefore matches both rules and gets two policies, which
 *   browsers intersect (AND): the fallback permits any inline script, the
 *   strict policy permits only the page's own hashes, so the effective script
 *   rule is the strict one. Verified empirically in a real browser before this
 *   was written — a single header value containing "policyA, policyB" enforced
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

// --- Tier 1: the catch-all. Everything except the strict script rule. ------
const blocks = [];
blocks.push(["/*", [`Content-Security-Policy: ${csp("'self' 'unsafe-inline'")}`, ...OTHER_HEADERS]]);

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
  `gen-headers: catch-all CSP = ${csp("'self' 'unsafe-inline'").length} chars (fallback); ` +
    `strict CSP per page = ${Math.min(...strictLines)}–${Math.max(...strictLines)} chars`
);
