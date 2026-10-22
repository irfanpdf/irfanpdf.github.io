/* Post-build adapter: fix Next.js static-export RSC payload naming on Windows.
 *
 * Known upstream bug: vercel/next.js#85374 ("Mismatch in RSC file paths causes
 * 404 errors in static exports on Windows"). On Windows builds, `output: "export"`
 * writes segment payloads as nested directories (e.g. out/download/__next.download/
 * __PAGE__.txt) because path.relative() yields backslashes, while the client
 * runtime prefetches the flat dot-form name (out/download/__next.download.__PAGE__.txt).
 * Result without this adapter: every <Link> prefetch 404s on the console and
 * client-side navigation falls back to full page loads. Builds on Linux/macOS
 * are unaffected. Fix PR: vercel/next.js#99058 (open as of 2026-10-16).
 *
 * This script copies each payload file next to its directory using the flat
 * dot-form name the client requests. It copies (never deletes), so it is safe
 * whether or not the upstream fix has landed. Run automatically by `npm run build`.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");
let copied = 0;

/** Copy every file under `dir` to `targetDir` as `<prefix>[.<subdir>].<name>`. */
function flattenDir(dir, prefix, targetDir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      flattenDir(p, `${prefix}.${entry.name}`, targetDir);
    } else {
      fs.copyFileSync(p, path.join(targetDir, `${prefix}.${entry.name}`));
      copied++;
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const p = path.join(dir, entry.name);
    if (entry.name.startsWith("__next.")) {
      flattenDir(p, entry.name, dir);
    } else {
      walk(p);
    }
  }
}

walk(OUT);
console.log(
  copied > 0
    ? `flatten-rsc: copied ${copied} RSC payload file(s) to flat dot-form names (workaround for next.js#85374)`
    : "flatten-rsc: nothing to do (payloads already flat)"
);
