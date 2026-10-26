/* Post-build: merge consecutive inline <script> elements in `out/**.html`.
 *
 * Why this exists:
 *   The catch-all CSP tier (scripts/gen-headers.mjs) carries the UNION of every
 *   inline-script hash in the export, and Cloudflare drops any `_headers` line
 *   over 2,000 chars. A Linux build emits 21 hashes (~1,463-char line, fits),
 *   but a Windows build splits the same pages into more inline scripts: 40
 *   hashes = 2,516 chars, over the limit — so Windows builds fell back to
 *   'unsafe-inline' in the catch-all (residual §6.9 open LOCALLY, while the
 *   deployed host was fine). Measured before this script existed: merging
 *   adjacent scripts takes Windows from 40 hashes to 20 (1,434-char line).
 *
 * What it does:
 *   For every exported HTML file, finds runs of INLINE EXECUTABLE scripts that
 *   sit next to each other separated only by whitespace, and concatenates each
 *   run's bodies into a single <script> element. Execution order is unchanged
 *   (classic inline scripts run in document order, and concatenation preserves
 *   order), so behaviour is identical — but the export now carries fewer,
 *   larger scripts, hence fewer hashes.
 *
 * Safety rules (the merge is refused unless ALL hold for a run):
 *   - scripts have no `src`;
 *   - executable type only (no type, or a JS MIME type) — JSON-LD
 *     (`application/ld+json`) and friends are never touched;
 *   - the ONLY attribute allowed is `type="..."` (or no attributes at all):
 *     a script carrying id/async/defer/nonce/data-* starts a fresh group and
 *     is left byte-for-byte alone, because merging would drop that attribute;
 *   - the gap between them is pure whitespace (HTML comments break the run);
 *   - all scripts in a run share the same type;
 *   - the merged body must not contain `</script` (it cannot — each input body
 *     is a complete script that already parsed — but it is asserted anyway).
 *
 * Run automatically by `npm run build` between `flatten-rsc` and `gen-headers`.
 * Exit 0 = done (or nothing to do); non-zero = a safety rule failed closed.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "out");

const JS_TYPES = new Set(["", "text/javascript", "application/javascript", "module"]);

function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

// One <script ...>...</script> element as data, or null if it is not an
// inline executable candidate (external src, JSON payload, etc.).
function readScript(html, index, attrs, body) {
  if (/\ssrc\s*=/i.test(attrs)) return null;
  const t = attrs.match(/\stype\s*=\s*["']([^"']+)["']/i);
  const type = t ? t[1] : "";
  if (!JS_TYPES.has(type)) return null;
  // Only a bare <script> or <script type="..."> may be merged; anything else
  // carries semantics a concatenation would silently drop.
  const rest = attrs.replace(/\stype\s*=\s*["'][^"']+["']/i, "").trim();
  if (rest !== "") return { index, attrs, body, type, mergeable: false };
  return { index, attrs, body, type, mergeable: true };
}

const files = walk(OUT);
if (files.length === 0) {
  console.error("merge-inline-scripts: no HTML files under out/ — did `next build` run?");
  process.exit(1);
}

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/g;

let scriptsBefore = 0;
let scriptsAfter = 0;
let filesChanged = 0;
let runsMerged = 0;
const allMergedBodies = [];

for (const file of files) {
  const html = readFileSync(file, "utf8");

  // Parse once, keeping original positions.
  const found = [];
  let m;
  SCRIPT_RE.lastIndex = 0;
  while ((m = SCRIPT_RE.exec(html))) {
    const parsed = readScript(html, m.index, m[1], m[2]);
    if (!parsed) continue;
    scriptsBefore += 1;
    found.push({ ...parsed, start: m.index, end: m.index + m[0].length, raw: m[0] });
  }
  if (found.length === 0) continue;

  // Build maximal runs of adjacent, mergeable, same-type scripts.
  const runs = [];
  let cur = null;
  for (const s of found) {
    const gap = cur ? html.slice(cur.lastEnd, s.start) : null;
    const adjacent = cur !== null && /^\s*$/.test(gap);
    const sameType = cur === null || cur.type === s.type;
    if (adjacent && sameType && s.mergeable) {
      cur.items.push(s);
      cur.lastEnd = s.end;
    } else {
      if (cur) runs.push(cur);
      cur = { type: s.type, items: [s], lastEnd: s.end };
    }
  }
  if (cur) runs.push(cur);

  // Apply merges from the END of the file backwards so positions stay valid.
  const multi = runs.filter((r) => r.items.length > 1).sort((a, b) => b.items[0].start - a.items[0].start);
  let out = html;
  for (const run of multi) {
    const body = run.items.map((i) => i.body).join("\n;\n");
    if (/<\/script/i.test(body)) {
      console.error(
        `merge-inline-scripts: FATAL — merged body in ${path.relative(ROOT, file)} would contain "</script"; refusing to write`
      );
      process.exit(1);
    }
    const first = run.items[0];
    const last = run.items[run.items.length - 1];
    const merged = `<script${first.attrs}>${body}</script>`;
    out = out.slice(0, first.start) + merged + out.slice(last.end);
    runsMerged += 1;
    allMergedBodies.push(body);
  }

  if (out !== html) {
    filesChanged += 1;
    writeFileSync(file, out, "utf8");
  }
}

// scripts surviving after the merges (re-count on the written files)
let surviving = 0;
const unique = new Set();
for (const file of files) {
  const html = readFileSync(file, "utf8");
  let m;
  SCRIPT_RE.lastIndex = 0;
  while ((m = SCRIPT_RE.exec(html))) {
    const parsed = readScript(html, m.index, m[1], m[2]);
    if (!parsed) continue;
    surviving += 1;
    // hash exactly what gen-headers will hash (the body it sees)
    unique.add(m[2]);
  }
}

const minus = scriptsBefore - surviving;
console.log(
  `merge-inline-scripts: ${files.length} HTML file(s), ${scriptsBefore} inline script(s) -> ` +
    `${surviving} (${runsMerged} run(s) merged, ${minus} element(s) absorbed) in ${filesChanged} file(s)`
);
console.log(`merge-inline-scripts: unique inline-script bodies after merge: ${unique.size}`);
if (unique.size === 0) {
  console.error("merge-inline-scripts: FATAL — no inline scripts left to hash; gen-headers would fail closed");
  process.exit(1);
}
