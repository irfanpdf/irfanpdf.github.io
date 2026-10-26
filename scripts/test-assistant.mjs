// Unit tests for the site assistant (src/lib/assistant.ts).
//
// Zero extra dependencies. The engine is loaded from TypeScript source in one
// of two ways, depending on what the installed toolchain still offers:
//
//   - typescript <= 6: the package ships the classic JS compiler API
//     (ts.transpileModule), so the engine and its `@/data/*` imports are
//     transpiled to CommonJS in memory and evaluated directly (original path);
//   - typescript >= 7 (the native port): the package root export is nothing
//     but version strings and the compiler is a native binary — there is NO
//     JS API left to transpile with. The .ts files are then imported as-is
//     and Node's built-in type stripping removes the types, with a
//     module.registerHooks() resolve hook mapping the tsconfig `@/*` alias
//     (needs Node >= 22.15 for the hook; >= 22.18 for type stripping by
//     default — dev machine and this repo's tooling are far above that).
//
// Run: npm run test:assistant        (exit code 0 = all PASS)

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
// Does this typescript still expose the classic in-memory transpile API?
const CLASSIC_API = Boolean(ts && typeof ts.transpileModule === "function");

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const SRC = path.join(ROOT, "src");

const cache = new Map();

// Classic mode (typescript <= 6): transpile to CommonJS and run it.
function loadTsFile(file) {
  if (cache.has(file)) return cache.get(file);
  const source = readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: file,
  });
  const module = { exports: {} };
  const shimRequire = (spec) => {
    if (spec.startsWith("@/")) {
      return loadTsFile(path.join(SRC, spec.slice(2) + ".ts"));
    }
    return require(spec);
  };
  const fn = new Function("exports", "module", "require", "__filename", "__dirname", outputText);
  fn(module.exports, module, shimRequire, file, path.dirname(file));
  cache.set(file, module.exports);
  return module.exports;
}

// Typescript >= 7 mode: no JS API, so let Node strip the types itself and
// teach Node's resolver the `@/*` tsconfig alias while we're at it.
async function loadEngine() {
  const entry = path.join(SRC, "lib", "assistant.ts");
  if (CLASSIC_API) return loadTsFile(entry);

  const { registerHooks } = await import("node:module");
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        const base = path.join(SRC, specifier.slice(2));
        for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
          if (existsSync(candidate)) {
            return { url: pathToFileURL(candidate).href, shortCircuit: true };
          }
        }
        throw new Error(`test-assistant: cannot resolve tsconfig alias "${specifier}" (tried ${base}.ts)`);
      }
      return nextResolve(specifier, context);
    },
  });
  return import(pathToFileURL(entry).href);
}

const lib = await loadEngine();
const { ENTRIES, SUGGESTIONS, FALLBACK, answerFor, matchEntry, normalize } = lib;

let pass = 0;
let fail = 0;
function check(ok, label, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// The 17 routes this site serves (same list crawl.js walks). Every assistant
// link must resolve inside this set — no dead ends.
const ROUTES = new Set([
  "/",
  "/compare/",
  "/docs/",
  "/docs/contact/",
  "/docs/conversion-guide/",
  "/docs/faq/",
  "/docs/installation/",
  "/docs/ocr-guide/",
  "/docs/privacy/",
  "/docs/release-notes/",
  "/docs/terms/",
  "/docs/troubleshooting/",
  "/download/",
  "/features/",
  "/how-it-works/",
  "/security/",
  "/use-cases/",
]);

// --- 1. routing: [question, expected entry id] -----------------------------
const ROUTING = [
  ["hi there", "greeting"],
  ["thank you!", "thanks"],
  ["what is irfan pdf", "what-is"],
  ["what is this app", "what-is"],
  ["is it free", "free"],
  ["how much does it cost", "free"],
  ["do my documents get uploaded anywhere", "privacy"],
  ["is my data sent to a server", "privacy"],
  ["does it work offline", "offline"],
  ["do i need internet", "offline"],
  ["system requirements", "requirements"],
  ["will it run on windows 10", "requirements"],
  ["which package should i download", "download"],
  ["how big is the installer", "download"],
  ["free download", "download"],
  ["how do i verify the download hash", "checksum"],
  ["smartscreen warning on the exe", "checksum"],
  ["how do i install it", "install-steps"],
  ["first run health check", "install-steps"],
  ["how do updates work", "update"],
  ["is there an auto updater", "update"],
  ["how do i uninstall", "uninstall"],
  ["where are my documents stored", "data-location"],
  ["back up my data folder", "data-location"],
  ["which languages does ocr read", "ocr-languages"],
  ["does ocr support hindi", "ocr-languages"],
  ["difference between searchable and editable ocr", "ocr-modes"],
  ["how accurate is ocr", "ocr-accuracy"],
  ["what does ocr do", "ocr-general"],
  ["convert pdf to word", "convert"],
  ["can it make a docx", "convert"],
  ["what happens to digitally signed pdfs", "signed"],
  ["open a password protected pdf", "encrypted"],
  ["how do i redact a pdf", "protect"],
  ["is there a mobile app", "mobile"],
  ["is there a linux version", "mobile"],
  ["what features does it have", "features"],
  ["can i edit text in a pdf", "features"],
  ["what does the pdf ai assistant do", "app-ai"],
  ["what version is this", "version"],
  ["release date of 1.7.0", "version"],
  ["is it well tested", "testing"],
  ["regression gate result", "testing"],
  ["compare two versions of a document", "compare"],
  ["batch process many files", "batch"],
  ["print odd pages only", "print"],
  ["compress to a target size", "compress"],
  ["enable admin user accounts", "multiuser"],
  ["run from source checkout", "source"],
  ["the app keeps crashing", "troubleshooting"],
  ["it stopped working", "troubleshooting"],
  ["how do i contact support", "contact"],
  ["who are you", "identity"],
  ["are you a real ai", "identity"],
];

for (const [q, expected] of ROUTING) {
  const got = matchEntry(q);
  check(
    got && got.id === expected,
    `route ${JSON.stringify(q)} -> ${expected}`,
    got ? `got ${got.id}` : "got fallback (null)",
  );
}

// --- 2. honest fallback ----------------------------------------------------
const NO_ANSWER = [
  "",
  "   ",
  "what is the capital of france",
  "tell me a joke about cats",
  "xyzzz nonsense qqq",
];
for (const q of NO_ANSWER) {
  const got = matchEntry(q);
  const ans = answerFor(q);
  check(
    got === null && ans.reply === FALLBACK.text && ans.link?.href === "/docs/",
    `fallback ${JSON.stringify(q)}`,
    got ? `unexpectedly matched ${got.id}` : "reply/link differ from FALLBACK",
  );
}

// --- 3. every suggestion chip routes to its intended answer ---------------
const SUGGESTION_TARGETS = [
  ["Is it free?", "free"],
  ["Does it work offline?", "offline"],
  ["What are the system requirements?", "requirements"],
  ["Which package should I download?", "download"],
  ["Which languages does OCR read?", "ocr-languages"],
  ["How do I install it?", "install-steps"],
];
check(SUGGESTIONS.length === SUGGESTION_TARGETS.length, "suggestions count matches expectations");
for (const [q, expected] of SUGGESTION_TARGETS) {
  const got = matchEntry(q);
  check(got && got.id === expected, `chip ${JSON.stringify(q)} -> ${expected}`, got ? `got ${got.id}` : "null");
}

// --- 4. reply hygiene: real, filled-in, leak-free --------------------------
for (const e of ENTRIES) {
  check(
    typeof e.reply === "string" && e.reply.trim().length >= 60,
    `entry ${e.id}: reply is substantial`,
    `length ${e.reply ? e.reply.trim().length : 0}`,
  );
  check(
    !e.reply.includes("undefined") && !e.reply.includes("{{") && !e.reply.includes("[object"),
    `entry ${e.id}: no template leaks`,
  );
  check(e.patterns.length >= 1 && e.patterns.every((p) => p === p.toLowerCase() && !/\s{2,}/.test(p)),
    `entry ${e.id}: patterns are lowercase and tidy`);
}

// --- 5. every link resolves to a route this site serves --------------------
for (const e of ENTRIES) {
  if (!e.link) continue;
  const route = e.link.href.split("#")[0];
  check(ROUTES.has(route), `entry ${e.id}: link ${e.link.href} is a real route`, "unknown route");
}
check(
  [FALLBACK.link.href, lib.INTRO.link.href].every((h) => ROUTES.has(h.split("#")[0])),
  "intro/fallback links are real routes",
);

// --- 6. entries are uniquely identified ------------------------------------
const ids = ENTRIES.map((e) => e.id);
check(new Set(ids).size === ids.length, "entry ids are unique");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
