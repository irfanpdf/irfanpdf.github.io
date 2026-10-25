/* Zero-dependency test server that serves `out/` WITH the security headers
 * exactly as `out/_headers` declares them (scripts/gen-headers.mjs writes that
 * file for real hosts). Lets the CSP be exercised in a browser locally before
 * any host change, so violations surface here and not in production.
 *
 *   node scripts/serve-headers.mjs        # default port 8124
 *   PORT=9000 node scripts/serve-headers.mjs
 *
 * Not part of the site; testing only.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "out");
const PORT = Number(process.env.PORT || 8124);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

/** Parse out/_headers (Cloudflare Pages / Netlify `_headers` format). */
function loadHeaders() {
  const file = path.join(ROOT, "_headers");
  if (!fs.existsSync(file)) {
    console.error("serve-headers: out/_headers missing — run `npm run build`");
    process.exit(1);
  }
  const map = {};
  let current = null;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) {
      current = line.trim();
      map[current] = map[current] || {};
    } else if (current) {
      const idx = line.indexOf(":");
      if (idx > 0) map[current][line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return map["/*"] || {};
}

const HEADERS = loadHeaders();

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\\/g, "/");
  if (clean.includes("..")) return null;
  const p = path.join(ROOT, clean);
  if (!p.startsWith(ROOT)) return null;
  for (const t of [p, p + ".html", path.join(p, "index.html")]) {
    try {
      const st = fs.statSync(t);
      if (st.isFile()) return t;
      if (st.isDirectory()) {
        const idx = path.join(t, "index.html");
        if (fs.existsSync(idx)) return idx;
      }
    } catch (_) {}
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  const status = file ? 200 : 404;
  const target = file || (fs.existsSync(path.join(ROOT, "404.html")) ? path.join(ROOT, "404.html") : null);

  const headers = { ...HEADERS };
  if (target) headers["content-type"] = TYPES[path.extname(target).toLowerCase()] || "application/octet-stream";
  res.writeHead(status, headers);
  if (target) fs.createReadStream(target).pipe(res);
  else res.end("Not found");
});

server.listen(PORT, () =>
  console.log(
    `serving ${ROOT} on http://127.0.0.1:${PORT} with ${Object.keys(HEADERS).length} security header(s)`
  )
);
