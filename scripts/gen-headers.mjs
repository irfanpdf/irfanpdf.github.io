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
 * Fail-closed: if no HTML is found, or no executable inline script can be
 * hashed, this exits non-zero and the build fails rather than shipping a
 * half-written policy.
 *
 * Run automatically by `npm run build` (after scripts/flatten-rsc.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const OUT = path.join(process.cwd(), "out");
const HEADERS_FILE = path.join(OUT, "_headers");

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

const files = walk(OUT);
if (files.length === 0) {
  console.error("gen-headers: no HTML found under out/ — refusing to write a policy");
  process.exit(1);
}

const hashes = new Set();
let scriptCount = 0;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  for (const body of inlineExecutableScripts(html)) {
    scriptCount++;
    const digest = crypto.createHash("sha256").update(body, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
}

if (hashes.size === 0) {
  console.error(
    "gen-headers: no executable inline scripts hashed — the CSP would be built " +
      "from an empty set. Refusing (this usually means the HTML shape changed)."
  );
  process.exit(1);
}

const sorted = [...hashes].sort();

// -------------------------------------------------------------------------
// The policy. default-src 'none' first: every fetch mode must be named, so a
// future dependency cannot quietly start loading something unplanned.
// -------------------------------------------------------------------------
const csp = [
  "default-src 'none'",
  `script-src 'self' ${sorted.join(" ")}`,
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

const headers = [
  "/*",
  `  Content-Security-Policy: ${csp}`,
  "  X-Content-Type-Options: nosniff",
  "  X-Frame-Options: DENY",
  "  Referrer-Policy: strict-origin-when-cross-origin",
  "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  "  Cross-Origin-Opener-Policy: same-origin",
  "  Cross-Origin-Resource-Policy: same-origin",
  "  X-Permitted-Cross-Domain-Policies: none",
  "  Strict-Transport-Security: max-age=31536000; includeSubDomains",
  "",
].join("\n");

fs.writeFileSync(HEADERS_FILE, headers, "utf8");

console.log(
  `gen-headers: scanned ${files.length} HTML file(s), ${scriptCount} inline ` +
    `executable script(s) -> ${hashes.size} unique SHA-256 hash(es)`
);
console.log(`gen-headers: wrote ${path.relative(process.cwd(), HEADERS_FILE)}`);
console.log(`gen-headers: CSP length = ${csp.length} chars`);
