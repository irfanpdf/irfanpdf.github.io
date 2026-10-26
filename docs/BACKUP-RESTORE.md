# Backup & Restore — operator guide

*Part of the IRFAN WEBSITE SECURITY & BACKUP MANAGER deliverables (§F, §K.6, §K.10,
§K.12). Every command and every result in this document was actually executed on
2026-10-26; nothing here is aspirational.*

---

## 1. What is backed up — and what is not

The site is a **static export with no backend**, so the real risk surface is small:

| Asset | Covered? | How |
|---|---|---|
| Source code, docs, scripts, workflow files | ✅ | `git bundle --all` (full history + working tree) |
| Uncommitted local work at backup time | ✅ | `uncommitted-changes.patch` + `uncommitted-status.txt`, and the manifest records `dirty: true` |
| Dependency lockfile | ✅ | inside the bundle |
| Built static site (`out/`) | ✅ optional | `create --with-build` |
| Cloudflare Pages settings (build command, env vars, Git link) | ⚠️ partial | snapshot documented below (§5) — the dashboard itself cannot be exported by this script |
| GitHub Actions variables (`SITE_URL`, `DOWNLOAD_BASE_URL`) | ⚠️ partial | documented in §5 |
| DNS / domains | ➖ | none to back up: the site lives on `pages.dev` (Cloudflare-owned zone); no custom domain exists yet |
| Database, user uploads | ➖ | **not applicable** — none exist |
| Credentials (PAT, 2FA recovery codes, Cloudflare login) | ❌ **deliberately excluded** | never written into any archive; store them offline (§7) |
| Git history as a "backup" of Cloudflare/GitHub settings | ❌ | git only knows git — see the limitation in §8 |

**Backups live outside the repository:** `<repo>/../SECURITY_BACKUPS/`
(override with `IRFAN_BACKUP_ROOT`). Because they are outside the tree, a backup
can never be committed, published as a static asset, or included in a deploy.

---

## 2. Commands

```powershell
# create (atomic: staged, hashed, manifest written last, then renamed into place)
node scripts/backup.mjs create                 # source + history + uncommitted diff
node scripts/backup.mjs create --with-build    # + the built out/ tree

# inspect
node scripts/backup.mjs list                   # VERIFIED / CORRUPT / NO-MANIFEST per dir
node scripts/backup.mjs verify <dir>           # recomputes SHA-256 of every file + git bundle verify

# restore (refuses to run unless the backup verifies PASS first)
node scripts/backup.mjs restore <dir> --target <new-dir>
node scripts/backup.mjs restore <dir> --target <dir> --force --run-tests

# retention (never removes the last verified backup)
node scripts/backup.mjs delete <dir> --confirm <exact-dir-name>
node scripts/backup.mjs prune --daily 7 --weekly 4 --yes
```

Exit codes: `0` PASS / applied, `1` FAIL / refused, `2` usage error.
Every action appends one line to `SECURITY_BACKUPS/audit-log.jsonl`
(timestamp, action, target, result — **no secrets**).

### Built-in safety rules (enforced in code)

- **Atomic creation** — written under `.staging-*`, published by rename only after
  `manifest.json` (the completion marker) exists. A directory without a manifest is
  reported as `NO-MANIFEST` and is never treated as a backup.
- **Verify before restore** — restore aborts if any SHA-256, size, or the
  `git bundle verify` check fails.
- **Fresh snapshot before overwriting** — a non-empty `--target` is refused unless
  `--force`, and with `--force` the current contents are copied to
  `SECURITY_BACKUPS/pre-restore-<name>-<ts>` *before* anything is written.
- **Never delete the last known-good** — `delete` and `prune` refuse if the removal
  would leave zero verified backups; `delete` also demands the exact directory name.
- **No keys inside archives** — nothing is encrypted by this tool, so there is no key
  to lose inside the file it protects.

---

## 3. Recommended schedule (all free)

| What | Where | Cost |
|---|---|---|
| Manual backup before every risky change | `node scripts/backup.mjs create --with-build` | free |
| Daily/weekly automated backup | `.github/workflows/backup.yml` (cron → builds, tests, backs up, uploads the bundle as a private Actions artifact) | free (public repo: unlimited Actions minutes) |
| Local belt-and-braces | Windows Task Scheduler running the same `create` command | free |
| Long-term retention | your own disk/external drive (Actions artifacts **expire** — max 90 days) | free |

Honest note on the Actions artifact: it is an **off-site copy with a clock on it**,
not permanent storage. Permanent copies are the local `SECURITY_BACKUPS` directories
plus whatever offline medium you copy them to.

---

## 4. Restore procedure (matches brief §F step by step)

1. **Select** — `node scripts/backup.mjs list`, pick the timestamp; note its `head=` commit.
2. **Fresh backup first** — `create --with-build` of the *current* state (or use
   `--force`, which snapshots the target automatically).
3. **Verify** — `verify <dir>` must print `PASS` (SHA-256 of every file + bundle).
4. **Restore to staging** — `restore <dir> --target <staging-dir>` (never straight onto
   production).
5. **Test the staging copy** — `restore … --run-tests` runs
   `npm ci && typecheck && test:assistant && build`; then serve it and run
   `check-live-headers.mjs` + `crawl.js` against the local port.
6. **Your explicit confirmation** — only after 4–5 pass do you push the restored
   commit to `main` (which is what actually redeploy both hosts). No push happens
   automatically from this script.
7. **Abort safely** — if verification fails the script exits non-zero *before*
   writing anything to the target.
8. **Rollback plan** — the pre-restore snapshot (step 2) plus branch
   `safety/pre-phase3-20261026` are the way back.
9. **Verify the live deployment** — run the checker and crawl against
   `https://irfanpdf.pages.dev` and confirm the 404/headers behaviour.
10. **Retest periodically** — a backup is not "recoverable" until a restore has been
    tested; §6 records the last test.

---

## 5. Configuration snapshot (what git cannot restore for you)

Recorded here so a clean machine can be rebuilt; re-check after any dashboard change:

| Setting | Where | Value |
|---|---|---|
| Pages project | Cloudflare → Workers & Pages → `irfanpdf` | Git-connected to `irfanpdf/irfanpdf.github.io`, production branch `main`, automatic deployments **on** |
| Build | same page | command `npm run build`, output `out`, root blank, build cache off |
| Env vars | Cloudflare → project → Variables | `NODE_VERSION=24`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DOWNLOAD_BASE_URL` (values in `docs/CLOUDFLARE-PAGES-MIGRATION.md` §2.3) |
| GitHub Actions variables | repo → Settings → Secrets and variables → Actions → Variables | `SITE_URL`, `DOWNLOAD_BASE_URL` |
| Deploy workflow | `.github/workflows/deploy.yml` | in the repo, so it is inside every bundle |
| Cloudflare account | — | account id in the dashboard URL; **store it with your credentials, not in git** |
| Branch protection | both repos, `main` | PR required (0 approvals), no force-push, no deletions, admin bypass on |

---

## 6. Test evidence (executed 2026-10-26)

| Test | Result |
|---|---|
| `create --with-build` (155 files, 5.8 MB, self-verify) | **PASS** |
| `verify` on the fresh backup (all SHA-256 + `git bundle verify`) | **PASS** |
| `list` — statuses reported correctly, legacy dirs marked `NO-MANIFEST` | **PASS** |
| Corruption detection — one byte flipped in a copy → SHA-256 mismatch, exit 1 | **PASS** (correctly **FAIL**s) |
| Directory without `manifest.json` → never accepted as a backup | **PASS** |
| `restore` into an empty target — HEAD matches manifest, 81 tracked files | **PASS** |
| `restore` refuses a non-empty target without `--force` | **PASS** |
| `restore --run-tests` (fresh clone: `npm ci`, typecheck, 206 tests, build) | **PASS** (§6.1; first attempt FAILED at `npm ci` — cause and fix recorded in §6.1) |
| `delete` without `--confirm` / with wrong name | **PASS** (refused, exit 2 / 1) |
| `delete` of the last verified backup | **PASS** (refused, backup still present) |
| `delete` of a non-last backup with exact confirmation | **PASS** |
| `prune --daily 7 --weekly 4 --yes` (keeps today's set) | **PASS** (`pruned 0, kept 1`; refuses without `--yes`, exit 2) |
| Restore to production + deploy | **NOT RUN** (requires your explicit approval — §4 step 6) |

### 6.1 Results appended after the runs completed (verbatim)

**`restore --run-tests` — the full recovery rehearsal (exit code 0 = PASS):**

```
restore source : C:\Users\<local-user>\Desktop\SECURITY_BACKUPS\irfan-20261026-101514
restore target : <temp>\backup-restore-full
  manifest      : 2026-10-26T04:45:15.580Z  head=4ef39c7  files=155
  integrity      : PASS (155 files, SHA-256 all match, bundle valid)
PASS  restored 4ef39c7 into <temp>\backup-restore-full
  --run-tests: running the verification suite now ...
  PASS  npm ci                    (added 47 packages, 0 vulnerabilities)
  PASS  npm run typecheck         (tsc --noEmit, exit 0)
  PASS  npm run test:assistant    (206 passed, 0 failed)
  PASS  npm run build             (21 static routes; merge step 99→60 scripts;
                                   gen-headers: catch-all CSP = 1409 chars,
                                   strong: 20 hashes, no unsafe-inline)
PASS  restored copy builds and passes its tests
full-restore exit: 0
```

**Failure honestly recorded — the first `--run-tests` run FAILED (exit 1) at step 1:**

```
  --run-tests: running the verification suite now ...
FAIL verification step failed: npm ci
full-restore exit: 1
```

Cause found by reproduction: on Windows the npm shim is `npm.cmd`, so
`execFileSync("npm", …)` without a shell returns `ENOENT spawnSync npm ENOENT`
(verified: `npm` without shell = ENOENT; with shell = `11.19.0`). The restore
*itself* had already succeeded — only the optional test loop failed. Fix: the
test loop now runs `execFileSync(..., { shell: process.platform === "win32" })`
with fixed literal arguments (never user input). The re-run above is the
post-fix result. On Linux/macOS the code path is unchanged (`shell: false`).

**`prune` evidence:**

```
$ node scripts/backup.mjs prune --daily 7 --weekly 4 --yes
PASS  pruned 0, kept 1 (daily=7, weekly=4)
prune exit: 0

$ node scripts/backup.mjs prune --daily 7 --weekly 4     # without --yes
FAIL prune needs --yes (and accepts --daily N --weekly N)
exit: 2
```

`pruned 0` is the correct result: every backup present was created today, so
all fall inside the daily window. Each entry in `list` re-verifies on every
run, and `audit-log.jsonl` records the earlier **FAIL** line from the
`npm ci` run as well — the log is append-only history, not a curated success
list.

---

## 7. Credentials are not in the backup — keep them separately

The archive intentionally contains **no** PAT, session, API key, or 2FA recovery
codes. Store them where a backup file cannot leak them:

- GitHub: PAT(s) + recovery codes — password manager or printed copy.
- Cloudflare: login + 2FA recovery codes (once 2FA is enabled) — password manager.
- This machine: Git Credential Manager already holds the GitHub credential; a new
  machine needs it re-created, not restored from a backup.

## 8. Honest limitations (read before trusting this)

- A backup protects against **loss**, not against **compromise**: if an attacker has
  your credentials they can also create "backups". Protect the account first (2FA,
  branch protection — see `SECURITY-HARDENING.md`).
- `git` history is **not** a backup of Cloudflare settings, DNS, GitHub variables, or
  secrets — §5 plus your offline credential store are.
- Nothing here is encrypted at rest; the files rely on the security of the machine
  and drive they sit on. Encryption (e.g. BitLocker, or an encrypted volume) is a
  change to your machine, not to this repo, and is your call.
- **A backup is unproven until a restore has been tested.** §6 is the last test; re-run
  it (§4) after any meaningful change to the backup script or the repository shape.
- No scan or test can guarantee freedom from viruses on any device, including
  visitors' machines.

## 9. Maintenance checklist

**Weekly**
- [ ] `node scripts/backup.mjs list` — every recent entry `VERIFIED`, no `CORRUPT`
- [ ] Actions `backup.yml` run succeeded (or your scheduled local run)
- [ ] GitHub/Cloudflare notifications reviewed (failed builds, dependency alerts)

**Monthly**
- [ ] One real `restore … --run-tests` into a temp directory (§4 steps 4–5)
- [ ] `prune --daily 7 --weekly 4 --yes` to stay inside disk budget
- [ ] Copy at least one backup to an **off-machine** location
- [ ] Re-read §5 against the actual dashboards (settings drift)

**After every risky change** (dependency bump, history rewrite, host config change)
- [ ] `create --with-build` **before** the change, verify it, then proceed
- [ ] Re-check branch protection still exists on both repos

**Do not**
- [ ] Store a backup inside `public/` or anywhere in the repo
- [ ] Delete the last verified backup (the tool refuses — don't work around it)
- [ ] Push to `main` as a "restore"; restore to staging first (§4)
