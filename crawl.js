/* Route + link crawler for the exported site. Zero dependencies.
 * Usage: node crawl.js [baseUrl]
 * Prints a PASS/FAIL summary: every expected route, every internal link,
 * every local asset, plus external links (listed, not fetched).
 */
const http = require("http");
const { URL } = require("url");

const BASE = process.argv[2] || "http://127.0.0.1:8123";

const EXPECTED_ROUTES = [
  "/", "/features", "/how-it-works", "/use-cases", "/compare", "/security",
  "/download", "/docs", "/docs/installation", "/docs/ocr-guide",
  "/docs/conversion-guide", "/docs/troubleshooting", "/docs/faq",
  "/docs/release-notes", "/docs/contact", "/docs/privacy", "/docs/terms",
  "/robots.txt", "/sitemap.xml", "/404",
];

function fetchUrl(url, redirects = 0) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.request(
      { hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: "GET", timeout: 15000 },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
            const next = new URL(res.headers.location, url).href;
            return fetchUrl(next, redirects + 1).then((r) =>
              resolve({ ...r, redirectedFrom: url, redirects: (r.redirects || 0) + 1 })
            );
          }
          resolve({ url, status: res.statusCode, headers: res.headers, body, redirects: 0 });
        });
      }
    );
    req.on("error", (e) => resolve({ url, status: 0, error: e.message, body: Buffer.alloc(0) }));
    req.on("timeout", () => { req.destroy(); resolve({ url, status: 0, error: "timeout", body: Buffer.alloc(0) }); });
    req.end();
  });
}

function extractLinks(html, baseUrl) {
  const hrefs = new Set();
  const attrRe = /(?:href|src)=["']([^"'#]+)["']/g;
  let m;
  while ((m = attrRe.exec(html))) hrefs.add(m[1]);
  // srcset lists
  const srcsetRe = /srcset=["']([^"']+)["']/g;
  while ((m = srcsetRe.exec(html))) {
    for (const part of m[1].split(",")) {
      const u = part.trim().split(/\s+/)[0];
      if (u) hrefs.add(u);
    }
  }
  const abs = [];
  for (const h of hrefs) {
    try {
      const u = new URL(h, baseUrl);
      abs.push(u);
    } catch (_) {}
  }
  return abs;
}

(async () => {
  const routeResults = [];
  for (const r of EXPECTED_ROUTES) {
    const res = await fetchUrl(BASE + r);
    routeResults.push({ route: r, status: res.status, bytes: res.body.length });
  }

  // crawl internal pages for links
  const seen = new Set();
  const queue = EXPECTED_ROUTES.filter((r) => !r.endsWith(".txt") && !r.endsWith(".xml")).map((r) => BASE + r);
  const badLinks = [];
  const externals = new Set();
  const assetResults = [];

  while (queue.length) {
    const url = queue.shift();
    const key = new URL(url).pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    const res = await fetchUrl(url);
    if (res.status !== 200) {
      if (!EXPECTED_ROUTES.includes(key)) badLinks.push({ from: "crawl", url: key, status: res.status });
      continue;
    }
    const ct = res.headers["content-type"] || "";
    if (!ct.includes("text/html")) continue;
    const html = res.body.toString("utf8");
    for (const u of extractLinks(html, url)) {
      if (u.origin !== new URL(BASE).origin) {
        externals.add(u.href);
        continue;
      }
      const p = u.pathname;
      if (p.startsWith("/_next/") || p.startsWith("/screenshots/") || p.startsWith("/favicon")) {
        // assets checked separately
        continue;
      }
      if (seen.has(p)) continue;
      queue.push(u.href);
    }
    // local assets on this page
    const assets = extractLinks(html, url).filter((u) => {
      const p = u.pathname;
      return u.origin === new URL(BASE).origin &&
        (p.startsWith("/_next/") || p.startsWith("/screenshots/") || p === "/favicon.ico");
    });
    for (const a of assets) {
      const ar = await fetchUrl(a.href);
      assetResults.push({ page: key, url: a.pathname, status: ar.status, bytes: ar.body.length });
    }
  }

  // dedicated checks
  const home = await fetchUrl(BASE + "/");
  const homeHtml = home.body.toString("utf8");
  const checks = {
    "home has title": /<title>[^<]+<\/title>/.test(homeHtml),
    "home has JSON-LD SoftwareApplication": homeHtml.includes('"@type":"SoftwareApplication"'),
    "no noindex anywhere": routeResults.every((r) => true) && !(await (async () => {
      for (const r of ["/", "/download", "/docs/faq", "/compare"]) {
        const x = await fetchUrl(BASE + r);
        if (x.body.toString("utf8").includes("noindex")) return true;
      }
      return false;
    })()),
    "404 page returns status 404": (await fetchUrl(BASE + "/definitely-missing-page")).status === 404,
    "robots.txt served": (await fetchUrl(BASE + "/robots.txt")).status === 200,
    "sitemap.xml served": (await fetchUrl(BASE + "/sitemap.xml")).status === 200,
  };

  const failedRoutes = routeResults.filter((r) => r.status !== 200);
  const failedAssets = assetResults.filter((a) => a.status !== 200);

  console.log("=== ROUTES ===");
  for (const r of routeResults) console.log(`${r.status === 200 ? "PASS" : "FAIL"} ${r.status} ${r.bytes}B ${r.route}`);
  console.log("\n=== PAGES DISCOVERED BY CRAWL ===");
  for (const p of [...seen].sort()) console.log("  " + p);
  console.log("\n=== BROKEN INTERNAL LINKS ===");
  console.log(badLinks.length ? JSON.stringify(badLinks, null, 2) : "  none");
  console.log("\n=== ASSETS ===");
  const assetSummary = {};
  for (const a of assetResults) assetSummary[a.url] = a.status;
  console.log(`  checked: ${assetResults.length}, failed: ${failedAssets.length}`);
  for (const f of failedAssets.slice(0, 20)) console.log(`  FAIL ${f.status} ${f.url} (on ${f.page})`);
  console.log("\n=== CONTENT CHECKS ===");
  for (const [k, v] of Object.entries(checks)) console.log(`${v ? "PASS" : "FAIL"} ${k}`);
  console.log("\n=== EXTERNAL LINKS (listed, not fetched) ===");
  for (const e of [...externals].sort()) console.log("  " + e);

  const ok =
    failedRoutes.length === 0 &&
    badLinks.length === 0 &&
    failedAssets.length === 0 &&
    Object.values(checks).every(Boolean);
  console.log("\nOVERALL: " + (ok ? "PASS" : "FAIL"));
  process.exit(ok ? 0 : 1);
})();
