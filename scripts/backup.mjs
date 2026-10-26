/* Backup & restore for the irfan-pdf-website repository.
 *
 * WHY THIS SHAPE: the site is a pure static export with NO backend, so a
 * browser button cannot perform privileged backups - anything the page could
 * do, an attacker who runs script on the page could do too. Genuine backups
 * therefore run where the admin's own credentials live: locally (this script)
 * and, optionally, in a scheduled GitHub Actions job (backup.yml).
 *
 * WHERE BACKUPS LIVE: <repo>/../SECURITY_BACKUPS/ - OUTSIDE the repository, so
 * a backup can never be committed, served as a public asset, or included in a
 * deploy by accident. Override with IRFAN_BACKUP_ROOT. Nothing encrypted is
 * stored here, and no credential, token or key is ever written into an archive
 * (the manifest records file names, sizes and SHA-256 checksums only).
 *
 * ATOMICITY: everything is built in ROOT/.staging-<name> and renamed into
 * place only after the manifest - the completion marker - has been written.
 * A directory without manifest.json is an incomplete backup and is ignored
 * (and reported) by list/verify/prune.
 *
 * SAFETY RULES ENFORCED IN CODE (not by convention):
 *   - verify recomputes SHA-256 for every file and runs `git bundle verify`;
 *   - restore refuses to run unless the backup verifies PASS first;
 *   - restore refuses a non-empty target unless --force, and with --force it
 *     first snapshots the target into ROOT/ (pre-restore safety copy);
 *   - delete requires --confirm <exact dir name> and can never remove the
 *     last remaining VERIFIED backup;
 *   - prune keeps the newest N per daily/weekly bucket and applies the same
 *     last-known-good guard;
 *   - every action appends one JSON line to ROOT/audit-log.jsonl (no secrets).
 *
 * Usage:
 *   node scripts/backup.mjs create [--with-build]
 *   node scripts/backup.mjs verify <backupDir>
 *   node scripts/backup.mjs list
 *   node scripts/backup.mjs restore <backupDir> --target <dir> [--force] [--run-tests]
 *   node scripts/backup.mjs delete <backupDir> --confirm <name>
 *   node scripts/backup.mjs prune [--daily 7] [--weekly 4] --yes
 *
 * Exit codes: 0 = PASS / action applied, 1 = FAIL / refused, 2 = usage error.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");
const ROOT = process.env.IRFAN_BACKUP_ROOT
  ? path.resolve(process.env.IRFAN_BACKUP_ROOT)
  : path.resolve(REPO, "..", "SECURITY_BACKUPS");
const MANIFEST = "manifest.json";
const AUDIT = "audit-log.jsonl";
const ALGO = "sha256";

// Files/dirs that are never part of a source backup (they are regenerated).
const SKIP = new Set([".git", "node_modules", ".next", "out", ".staging-"]);

function die(msg) {
  process.stderr.write(`FAIL ${msg}\n`);
  process.exit(1);
}
function usage(msg) {
  process.stderr.write(`FAIL ${msg}\n`);
  process.stderr.write("usage: node scripts/backup.mjs create|verify|list|restore|delete|prune [args]\n");
  process.exit(2);
}
function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}
function audit(entry) {
  fs.mkdirSync(ROOT, { recursive: true });
  const line = JSON.stringify({ ts: new Date().toISOString(), tool: "scripts/backup.mjs", ...entry }) + "\n";
  fs.appendFileSync(path.join(ROOT, AUDIT), line, "utf8");
}
function sha256(file) {
  return createHash(ALGO).update(fs.readFileSync(file)).digest("hex");
}
function walk(dir, base = dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, acc);
    else if (e.isFile()) acc.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return acc;
}
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function isBackupDir(p) {
  return fs.statSync(p, { throwIfNoEntry: false })?.isDirectory() && fs.existsSync(path.join(p, MANIFEST));
}
function readManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, MANIFEST), "utf8"));
}
function backups() {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => path.join(ROOT, e.name))
    .filter(isBackupDir)
    .sort();
}
function incomplete() {
  if (!fs.existsSync(ROOT)) return [];
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => path.join(ROOT, e.name))
    .filter((p) => !isBackupDir(p));
}

// ---------------------------------------------------------------- verify ----
function verify(dir, { quiet = false } = {}) {
  const problems = [];
  if (!fs.existsSync(dir)) return { ok: false, problems: [`backup not found: ${dir}`] };
  const mf = path.join(dir, MANIFEST);
  if (!fs.existsSync(mf)) return { ok: false, problems: ["manifest.json missing -> incomplete/interrupted backup (never treated as a backup)"] };
  let m;
  try {
    m = JSON.parse(fs.readFileSync(mf, "utf8"));
  } catch (e) {
    return { ok: false, problems: [`manifest.json unreadable: ${e.message}`] };
  }
  for (const f of m.files || []) {
    const p = path.join(dir, f.path);
    if (!fs.existsSync(p)) {
      problems.push(`missing file: ${f.path}`);
      continue;
    }
    const bytes = fs.statSync(p).size;
    if (bytes !== f.bytes) problems.push(`size mismatch: ${f.path} (${bytes} != ${f.bytes})`);
    const h = sha256(p);
    if (h !== f.sha256) problems.push(`SHA-256 mismatch: ${f.path}`);
  }
  // the bundle must also be structurally valid (catches truncation)
  const bundle = (m.files || []).find((f) => f.path.endsWith(".bundle"));
  if (bundle) {
    try {
      sh("git", ["bundle", "verify", path.join(dir, bundle.path)]);
    } catch (e) {
      problems.push(`git bundle verify failed: ${String(e.stderr || e.message).trim().slice(0, 200)}`);
    }
  }
  const ok = problems.length === 0;
  if (!quiet) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${path.basename(dir)}`);
    console.log(`  files: ${(m.files || []).length}   bytes: ${m.totalBytes}   created: ${m.createdAt}   git: ${m.git?.head}`);
    console.log(`  bundle verify: ${bundle ? "ran" : "no bundle in manifest"}`);
    for (const p of problems) console.log(`  - ${p}`);
  }
  return { ok, problems, manifest: m };
}

// ---------------------------------------------------------------- create ----
function create(args) {
  const withBuild = args.includes("--with-build");
  const name = `irfan-${stamp()}`;
  const staging = path.join(ROOT, `.staging-${name}`);
  const final = path.join(ROOT, name);
  fs.mkdirSync(staging, { recursive: true });
  const started = Date.now();

  // 1. source history + working tree (bundle is the authoritative copy)
  try {
    sh("git", ["bundle", "create", path.join(staging, "source.bundle"), "--all"]);
    sh("git", ["bundle", "verify", path.join(staging, "source.bundle")]);
  } catch (e) {
    fs.rmSync(staging, { recursive: true, force: true });
    audit({ action: "create", result: "FAIL", reason: "git bundle failed" });
    die(`git bundle failed: ${String(e.stderr || e.message).trim().slice(0, 300)}`);
  }

  // 2. uncommitted work, if any - a backup that silently drops local changes
  //    is a lie, so capture the diff and say so in the manifest.
  let dirty = false;
  try {
    const status = sh("git", ["status", "--porcelain"]).trim();
    dirty = status.length > 0;
    if (dirty) {
      const patch = sh("git", ["diff", "HEAD"]);
      fs.writeFileSync(path.join(staging, "uncommitted-changes.patch"), patch, "utf8");
      fs.writeFileSync(path.join(staging, "uncommitted-status.txt"), status + "\n", "utf8");
    }
  } catch {
    /* status is best-effort; the bundle still stands */
  }

  // 3. optional: the built static site (regenerable, but handy for forensics)
  if (withBuild && fs.existsSync(path.join(REPO, "out"))) {
    const copyDir = (src, dst) => {
      fs.mkdirSync(dst, { recursive: true });
      for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, e.name);
        const d = path.join(dst, e.name);
        if (e.isDirectory()) copyDir(s, d);
        else if (e.isFile()) fs.copyFileSync(s, d);
      }
    };
    copyDir(path.join(REPO, "out"), path.join(staging, "build-output"));
  }

  // 4. manifest last = completion marker (files sorted for stable diffs)
  let files = [];
  try {
    files = walk(staging).map((rel) => {
      const p = path.join(staging, rel);
      return { path: rel, bytes: fs.statSync(p).size, sha256: sha256(p) };
    });
  } catch (e) {
    fs.rmSync(staging, { recursive: true, force: true });
    die(`hashing failed: ${e.message}`);
  }
  const manifest = {
    manifestVersion: 1,
    createdAt: new Date().toISOString(),
    algorithm: ALGO,
    repository: "irfan-pdf-website",
    git: {
      head: sh("git", ["rev-parse", "HEAD"]).trim(),
      branch: sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim(),
      dirty,
    },
    includesBuildOutput: withBuild && fs.existsSync(path.join(staging, "build-output")),
    files,
    totalBytes: files.reduce((a, f) => a + f.bytes, 0),
    durationMs: Date.now() - started,
  };
  fs.writeFileSync(path.join(staging, MANIFEST), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  // 5. atomic publish
  try {
    fs.renameSync(staging, final);
  } catch (e) {
    audit({ action: "create", result: "FAIL", reason: `rename: ${e.message}` });
    die(`could not finalise backup (left incomplete in ${staging}): ${e.message}`);
  }

  const v = verify(final, { quiet: true });
  audit({
    action: "create",
    target: name,
    result: v.ok ? "PASS" : "FAIL",
    bytes: manifest.totalBytes,
    files: files.length,
    head: manifest.git.head,
    dirty,
    verify: v.ok ? "PASS" : `FAIL (${v.problems.length} problem(s))`,
  });
  console.log(`${v.ok ? "PASS" : "FAIL"}  backup created: ${final}`);
  console.log(`  files: ${files.length}   bytes: ${manifest.totalBytes}   git: ${manifest.git.head.slice(0, 7)}   dirty: ${dirty}`);
  console.log(`  self-verify after create: ${v.ok ? "PASS" : "FAIL - " + v.problems.join("; ")}`);
  if (incomplete().length)
    console.log(
      `  NOTE: ${incomplete().length} directory(ies) without manifest.json are ignored by this tool (legacy/manual backups, or an interrupted write): ${incomplete()
        .map((p) => path.basename(p))
        .join(", ")}`
    );
  if (!v.ok) process.exit(1);
}

// ----------------------------------------------------------------- list -----
function list() {
  const all = backups();
  const bad = incomplete();
  if (all.length === 0 && bad.length === 0) {
    console.log(`no backups under ${ROOT}`);
    return;
  }
  console.log(`backup root: ${ROOT}`);
  for (const dir of all) {
    const m = readManifest(dir);
    const v = verify(dir, { quiet: true });
    const mb = (m.totalBytes / (1024 * 1024)).toFixed(1);
    console.log(
      `  ${v.ok ? "VERIFIED" : "CORRUPT "}  ${path.basename(dir)}  ${mb} MiB  ${m.files.length} files  ${m.createdAt}  head=${String(m.git?.head).slice(0, 7)}${m.git?.dirty ? " (dirty)" : ""}`
    );
  }
  for (const dir of bad) console.log(`  NO-MANIFEST ${path.basename(dir)}  (legacy/manual backup or interrupted write - ignored, not verified)`);
}

// --------------------------------------------------------------- restore ----
function restore(args) {
  // args shape: <backupDir> --target <dir> [--force] [--run-tests]
  const dir = args[0];
  const tIdx = args.indexOf("--target");
  const target = tIdx >= 0 ? args[tIdx + 1] : null;
  if (!dir || !target || dir.startsWith("--")) usage("restore needs <backupDir> --target <dir>");
  const src = path.resolve(dir);
  const tgt = path.resolve(target);

  console.log(`restore source : ${src}`);
  console.log(`restore target : ${tgt}`);
  const v = verify(src, { quiet: true });
  if (!v.ok) {
    audit({ action: "restore", target: src, result: "ABORT", reason: "verification failed" });
    console.log("FAIL  aborting: the selected backup does not verify - nothing was written");
    for (const p of v.problems) console.log(`  - ${p}`);
    process.exit(1);
  }
  console.log("  manifest      : " + `${v.manifest.createdAt}  head=${v.manifest.git.head.slice(0, 7)}  files=${v.manifest.files.length}`);
  console.log(`  integrity      : PASS (${v.manifest.files.length} files, SHA-256 all match, bundle valid)`);

  const exists = fs.existsSync(tgt);
  const nonEmpty = exists && fs.readdirSync(tgt).length > 0;
  if (nonEmpty && !args.includes("--force")) {
    audit({ action: "restore", target: tgt, result: "ABORT", reason: "target not empty" });
    die(`target is not empty: ${tgt}  (re-run with --force to snapshot it first, then restore)`);
  }
  let safety = null;
  if (nonEmpty) {
    safety = path.join(ROOT, `pre-restore-${path.basename(tgt)}-${stamp()}`);
    fs.mkdirSync(safety, { recursive: true });
    for (const rel of walk(tgt)) {
      const s = path.join(tgt, rel);
      const d = path.join(safety, rel);
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
    }
    console.log(`  pre-restore snapshot of the target: ${safety}`);
  }

  try {
    fs.mkdirSync(tgt, { recursive: true });
    sh("git", ["clone", "--quiet", path.join(src, "source.bundle"), tgt]);
  } catch (e) {
    audit({ action: "restore", target: tgt, result: "FAIL", reason: "clone failed" });
    die(`restore failed during clone: ${String(e.stderr || e.message).trim().slice(0, 300)}`);
  }
  const head = sh("git", ["rev-parse", "HEAD"], { cwd: tgt }).trim();
  const expected = v.manifest.git.head;
  if (head !== expected) {
    audit({ action: "restore", target: tgt, result: "FAIL", reason: "head mismatch" });
    die(`restored HEAD ${head} != manifest HEAD ${expected}`);
  }
  audit({ action: "restore", source: path.basename(src), target: tgt, result: "PASS", head, snapshot: safety ? path.basename(safety) : null });
  console.log(`PASS  restored ${expected.slice(0, 7)} into ${tgt}`);
  console.log("next steps (restoration is NOT complete until these pass):");
  console.log("  cd " + tgt);
  console.log("  npm ci && npm run typecheck && npm run test:assistant && npm run build");
  console.log("  node scripts/serve-headers.mjs   # then the checker + crawl against :8124");
  if (args.includes("--run-tests")) {
    console.log("  --run-tests: running the verification suite now ...");
    // npm is npm.cmd on Windows: execFileSync needs a shell there (ENOENT
    // otherwise). The args below are fixed literals, never user input, so the
    // shell cannot be talked into anything unexpected.
    const useShell = process.platform === "win32";
    for (const [c, a] of [["npm", ["ci"]], ["npm", ["run", "typecheck"]], ["npm", ["run", "test:assistant"]], ["npm", ["run", "build"]]]) {
      try {
        execFileSync(c, a, { cwd: tgt, stdio: ["ignore", "inherit", "inherit"], shell: useShell });
        console.log(`  PASS  ${c} ${a.join(" ")}`);
      } catch {
        audit({ action: "restore-tests", result: "FAIL", step: `${c} ${a.join(" ")}` });
        die(`verification step failed: ${c} ${a.join(" ")}`);
      }
    }
    console.log("PASS  restored copy builds and passes its tests");
  }
}

// ---------------------------------------------------------------- delete ----
function del(args) {
  const cIdx = args.indexOf("--confirm");
  const token = cIdx >= 0 ? args[cIdx + 1] : null;
  const target = args.find((a) => !a.startsWith("--") && a !== token);
  if (!target || !token) usage("delete needs <backupDir> --confirm <exact-backup-name>");
  const p = path.resolve(target);
  if (!isBackupDir(p)) die(`not a recognised backup (missing manifest): ${p}`);
  if (path.basename(p) !== token) {
    audit({ action: "delete", target: path.basename(p), result: "REFUSED", reason: "confirmation name mismatch" });
    die(`confirmation mismatch: pass --confirm "${path.basename(p)}" exactly`);
  }
  const others = backups().filter((d) => d !== p);
  const verifiedOthers = others.filter((d) => verify(d, { quiet: true }).ok);
  const selfOk = verify(p, { quiet: true }).ok;
  if (selfOk && verifiedOthers.length === 0) {
    audit({ action: "delete", target: path.basename(p), result: "REFUSED", reason: "last verified backup" });
    die("refusing: this is the LAST verified backup - create and verify another one first");
  }
  fs.rmSync(p, { recursive: true, force: true });
  audit({ action: "delete", target: path.basename(p), result: "PASS", remainingBackups: others.length });
  console.log(`PASS  deleted ${p}  (${others.length} other backup(s) remain)`);
}

// ----------------------------------------------------------------- prune ----
function prune(args) {
  const g = (flag, dflt) => {
    const i = args.indexOf(flag);
    return i >= 0 ? parseInt(args[i + 1], 10) : dflt;
  };
  const daily = g("--daily", 7);
  const weekly = g("--weekly", 4);
  if (!args.includes("--yes")) usage("prune needs --yes (and accepts --daily N --weekly N)");
  const all = backups();
  const buckets = new Map();
  const week = (d) => Math.floor((Date.now() - d.getTime()) / 7 * 24 * 3600 * 1000);
  for (const dir of all) {
    const m = readManifest(dir);
    const created = new Date(m.createdAt);
    const ageDays = (Date.now() - created.getTime()) / 86400000;
    const key = ageDays <= daily ? "daily" : ageDays <= weekly * 7 ? "weekly" : "expired";
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push({ dir, created, key });
  }
  const keep = new Set();
  const dailies = (buckets.get("daily") || []).sort((a, b) => b.created - a.created).slice(0, daily);
  const weeklies = (buckets.get("weekly") || []).sort((a, b) => b.created - a.created).slice(0, weekly);
  for (const e of [...dailies, ...weeklies]) keep.add(e.dir);
  const removable = all.filter((d) => !keep.has(d));
  const removableVerified = removable.filter((d) => verify(d, { quiet: true }).ok);
  const survivorsVerified = all.filter((d) => !removable.includes(d) && verify(d, { quiet: true }).ok);
  if (removableVerified.length > 0 && survivorsVerified.length === 0) {
    audit({ action: "prune", result: "REFUSED", reason: "would delete every verified backup" });
    die("refusing: pruning would remove all verified backups");
  }
  for (const d of removable) {
    fs.rmSync(d, { recursive: true, force: true });
    console.log(`  removed ${path.basename(d)}`);
  }
  audit({ action: "prune", result: "PASS", removed: removable.length, kept: keep.size, daily, weekly });
  console.log(`PASS  pruned ${removable.length}, kept ${keep.size} (daily=${daily}, weekly=${weekly})`);
}

// ------------------------------------------------------------------ main ----
const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "create") create(rest);
  else if (cmd === "verify") {
    if (!rest[0]) usage("verify needs <backupDir>");
    const r = verify(path.resolve(rest[0]));
    audit({ action: "verify", target: path.basename(rest[0]), result: r.ok ? "PASS" : "FAIL", problems: r.problems.length });
    process.exit(r.ok ? 0 : 1);
  } else if (cmd === "list") list();
  else if (cmd === "restore") restore(rest);
  else if (cmd === "delete") del(rest);
  else if (cmd === "prune") prune(rest);
  else usage(cmd ? `unknown command: ${cmd}` : "missing command");
} catch (e) {
  process.stderr.write(`FAIL unexpected error: ${e.stack || e.message}\n`);
  process.exit(1);
}
