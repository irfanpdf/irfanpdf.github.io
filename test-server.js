/* Zero-dependency static server for the exported site (testing only).
 * Serves `out/` with directory-index resolution: /compare -> compare/index.html
 * Also exposes GET /__routes listing (not part of the site).
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "out");
const PORT = Number(process.env.PORT || 8123);

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

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\\/g, "/");
  if (clean.includes("..")) return null;
  let p = path.join(ROOT, clean);
  if (!p.startsWith(ROOT)) return null;
  const tries = [
    p,
    p + ".html",
    path.join(p, "index.html"),
  ];
  for (const t of tries) {
    try {
      const st = fs.statSync(t);
      if (st.isFile()) return t;
      if (st.isDirectory()) {
        const idx = path.join(t, "index.html");
        if (fs.statSync(idx).isFile()) return idx;
      }
    } catch (_) {}
  }
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    // custom 404 (mirrors static hosts)
    const nf = path.join(ROOT, "404.html");
    const body = fs.existsSync(nf) ? fs.readFileSync(nf) : "Not found";
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, { "content-type": TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log("serving " + ROOT + " on http://127.0.0.1:" + PORT));
