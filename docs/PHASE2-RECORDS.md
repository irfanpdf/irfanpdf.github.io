# Phase 2 hardening record — repository, cloud console, backup

*Executed 2026-10-26 → 2026-10-27 as part of the IRFAN WEBSITE SECURITY & BACKUP
MANAGER brief. Every status below is backed by something that was actually run or
clicked; nothing here is inferred from intent. No credential, token, key or personal
address appears anywhere in this file.*

**Status legend:** `PASS` verified working · `FAIL` verified broken · `NOT RUN` not
executed · `NOT APPLICABLE` cannot apply to this deployment · `OPEN` known remaining
work.

**Cost: ₹0.** Nothing was purchased, no plan was upgraded, no payment method was
added to the account. Every control in this record is on a free tier.

---

## 1. Summary

| ID | Control | Status | One-line evidence |
|----|---------|--------|-------------------|
| H1 | Cloudflare account 2FA | **PASS** (email method) | Re-read from `/profile/access-management/authentication/two-factor` after a full reload: *"Email two-factor authentication is active"*, button reads `Disable` (§4.2). Weaker than TOTP — residual-risk note in §4.2 |
| H2 | Branch protection on `main`, both repos | **PASS** | Read back from the API: PR required, 0 approvals, no force-push, no deletions, admin bypass retained |
| H3 | Releases repo: signed installers | **OPEN** | Not part of this batch; unchanged from the Phase 1 finding |
| M1 | Personal data in tracked docs | **PASS** (tree) / **PASS** (history, with a server-side caveat) | `git grep` at `HEAD` → 0; history rewritten 2026-10-27 → 0 in contents and messages across all 25 commits (§8). Caveat: old objects were still resolvable by SHA after the push (§8.6) |
| M2 | Dependabot alerts + security updates | **PASS** | `vulnerability-alerts` and `automated-security-fixes` enabled and read back `enabled` on both repos |
| M3 | Over-broad token scope | **OPEN** — measured, decided, **not yet applied** | Credential measured in memory: OAuth token (`gho_`, 40 chars), scopes `gist, repo, workflow`, account-wide, admin on all 3 repos (§10.1). Owner chose a fine-grained PAT on 2 repos + revoking the old grant (§10.3). Replacement **NOT RUN** as of 2026-10-29 15:22 — five checks all read back the old token, entry untouched since 2026-10-22 (§10.4) |
| M4 | `github.io` sends no custom headers | **OPEN** | Unchanged — that host is Cloudflare-free, so it serves no `_headers` (§5) |
| M5 | Preview deployments publicly readable | **PASS** | "Restricted by a Cloudflare Access policy" in settings + live `302` to the Access login at the edge (§4.3) |
| L1 | `Access-Control-Allow-Origin: *` on every response | **PASS** (`pages.dev`) / **OPEN** (`github.io`) | `!` detach rule added to the `/*` rule; header measured **absent** on 5 live URLs incl. the 404 catch-all, other 8 headers intact, checker + crawl PASS (§9). `github.io` sends it from GitHub's own defaults — tied to M4 |
| — | Account WAF / rate limiting | **NOT APPLICABLE** (today) | WAF rules attach to a zone we own; this project owns no zone. Paid add-on deliberately not bought (§5) |
| — | Security notifications | **PASS** (1 live) | Incident alert listed as `Cloudflare Status / Email / Enabled`; other alert types N/A (§4.4) |
| F | Backup & restore capability | **PASS** | Restore re-ran `npm ci` + typecheck + 206 tests + build from a fresh clone (§3) |
| F2 | Scheduled backup job | **PASS** | `backup-and-verify` run #1: 14/14 steps green, 2.2 MB artifact, log quotes in §3.4 |
| — | Paid WAF, plan upgrade, payment method | **NOT APPLICABLE** | Blocked by the zero-cost constraint and by the absence of a zone |

---

## 2. Repository controls (GitHub, free tier)

### 2.1 Branch protection — H2 (applied, then read back)

Applied to `main` of **both** repositories — `irfanpdf/irfanpdf.github.io` and
`irfanpdf/irfanpdf-releases` — then verified by reading the rule back:

```
PR-required=True  approvals=0  enforce_admins=False  force_push_allowed=False
deletions_allowed=False  status_checks=False  restrictions=False   protected=true
```

Deliberate choices, each for a stated reason:

- **0 approving reviews** — a single-person repository would deadlock if a review
  were required.
- **`enforce_admins=false`** — keeps an emergency bypass so a misconfiguration can
  never lock the owner out. The trade-off: direct pushes by the admin still work,
  and the remote says so out loud — the push that delivered this batch reported
  `Bypassed rule violations for refs/heads/main: Changes must be made through a pull
  request`, which is simultaneously proof the rule is live and proof the bypass is
  active.
- **no required status checks** — `.github/workflows/deploy.yml` has no
  `pull_request` trigger, so requiring checks would have deadlocked every PR.

Evidence that it is enforced, not just declared: the API read-back above plus the
remote's bypass message during the `4ef39c7..40d9730` push.

### 2.2 Dependabot — M2

Enabled via API and verified by reading the repository object back:

```
vulnerability-alerts:        enabled   (PUT 204, HEAD verify ok)
automated-security-fixes:    enabled   (PUT 204)
dependabot_security_updates: enabled
secret_scanning:             enabled
secret_scanning_push_protection: enabled
```

Same for `irfanpdf/irfanpdf-releases`. Notifications now flow through GitHub's
security alert emails — free.

### 2.3 Personal data removed from the working tree — M1

Four lines across two documents carried an email address and a pre-rename account
name. Replaced with `[personal email redacted]` / `[previous username redacted]`
(commit `4ef39c7`, documentation only — no source, build or config file touched).

Verification: `git grep` for both PII tokens across `HEAD` → **0 matches**.

**Boundary, as it stood then:** this commit fixed the current tree only; the same
strings remained in pushed history (several commits carried the old account name,
and 1 commit message carried a local filesystem path). Purging them required a
history rewrite + force-push — every commit rewritten, every clone broken, both
hosts rebuilt. That was left as a separate, explicitly-confirmed decision on
2026-10-26 and then **carried out on 2026-10-27** — §8.

---

## 3. Backup & restore — brief §F

### 3.1 What was built

`scripts/backup.mjs` (zero dependencies) + `docs/BACKUP-RESTORE.md` (operator
guide) + `.github/workflows/backup.yml` (scheduled job).

Design rules enforced in code rather than by convention:

- backups are written **outside the repository** (`<repo>/../SECURITY_BACKUPS`,
  override `IRFAN_BACKUP_ROOT`) so a backup can never be committed, published as a
  static asset, or shipped in a deploy;
- creation is **atomic** — staged, hashed, `manifest.json` written last, directory
  renamed into place. A directory without a manifest is an incomplete write and is
  never treated as a backup;
- `verify` recomputes SHA-256 for every file **and** runs `git bundle verify`;
- `restore` refuses to run unless the backup verifies PASS, refuses a non-empty
  target without `--force`, and with `--force` snapshots the target first;
- `delete` needs the exact directory name and can never remove the last verified
  backup; `prune` applies the same guard and needs `--yes`;
- every action appends one line to `audit-log.jsonl` (timestamp, action, result —
  no secrets; nothing is encrypted, so no key can be lost inside an archive).

### 3.2 Test results (all executed 2026-10-26)

| Test | Result |
|---|---|
| `create --with-build` — 155 files, 5.8 MB, self-verify | **PASS** |
| `verify` — every SHA-256 + `git bundle verify` | **PASS** |
| One byte flipped in a copy → `SHA-256 mismatch`, exit 1 | **PASS** (correctly FAILs) |
| Directory with no `manifest.json` | **PASS** (refused, exit 1) |
| `restore` into an empty target — restored `HEAD` == manifest `HEAD` | **PASS** |
| `restore` into a non-empty target without `--force` | **PASS** (refused) |
| `delete` without `--confirm` / with a wrong name | **PASS** (exit 2 / exit 1) |
| `delete` of the last verified backup | **PASS** (refused, backup still present) |
| `prune --daily 7 --weekly 4 --yes` | **PASS** (`pruned 0, kept 1`) |
| `prune` without `--yes` | **PASS** (exit 2) |
| `restore --run-tests` — full recovery rehearsal | **PASS**, see §3.3 |
| Restore to production + deploy | **NOT RUN** — requires explicit approval by design |

### 3.3 The recovery rehearsal, including the failure that preceded it

The first `restore --run-tests` **failed**:

```
  --run-tests: running the verification suite now ...
FAIL verification step failed: npm ci
full-restore exit: 1
```

Reproduced rather than guessed at: on Windows `npm` is `npm.cmd`, so
`execFileSync("npm", …)` without a shell returns `ENOENT spawnSync npm ENOENT`
(without shell → ENOENT; with shell → `11.19.0`). The restore itself had already
succeeded; only the optional test loop failed. Fixed by enabling the shell on
`win32` only, with fixed literal arguments (never user input).

Re-run after the fix, exit code 0:

```
  integrity      : PASS (155 files, SHA-256 all match, bundle valid)
PASS  restored 4ef39c7 into <temp dir>
  PASS  npm ci                   (47 packages, 0 vulnerabilities)
  PASS  npm run typecheck
  PASS  npm run test:assistant   (206 passed, 0 failed)
  PASS  npm run build            (21 static routes; catch-all CSP = 1409 chars,
                                  strong: 20 hashes, no unsafe-inline)
PASS  restored copy builds and passes its tests
full-restore exit: 0
```

The failure stays in the commit message, in `docs/BACKUP-RESTORE.md` §6.1 and in
`audit-log.jsonl` — a backup tool whose only recorded history is successes would
not be trustworthy.

### 3.4 The scheduled job, executed

`backup-and-verify` was dispatched manually (`workflow_dispatch`) and run #1
completed `success` on a clean Linux runner. All 14 steps green:

```
[success] Run npm ci
[success] Run npm run typecheck
[success] Run npm run test:assistant    -> 206 passed, 0 failed
[success] Run npm run build            -> catch-all CSP = 1409 chars (strong: 20 hashes)
[success] Run node scripts/backup.mjs create --with-build
             PASS  backup created: /home/runner/work/_temp/SECURITY_BACKUPS/irfan-20261026-045054
               files: 136   bytes: 5603382   git: 40d9730   dirty: false
               self-verify after create: PASS
[success] Run node scripts/backup.mjs list
[success] Run actions/upload-artifact@v4
artifacts: irfan-backup-1  2.2 MB  expired=False
```

Stated limitations (kept in the workflow file itself):

- the Actions artifact **expires after 90 days** — an off-site copy with a clock on
  it, not permanent storage;
- GitHub disables scheduled workflows after ~60 days without repository activity;
- a failed run emails the owner — that is the alert channel until something better
  exists;
- the job runs with `contents: read` only: it cannot push, deploy or modify the site.

---

## 4. Cloud console (Cloudflare, free tier)

### 4.1 Account posture observed

| Fact | Value |
|---|---|
| Plan | Workers Free, no payment method on file |
| Members | 1 (sole Super admin) |
| API tokens | none |
| Audit log (last 7 days) | 0 events before this engagement |
| 2FA | **Active — email method** since 2026-10-27 (H1, §4.2) |

### 4.2 Cloudflare 2FA — H1 (enabled 2026-10-27, email method)

Timeline, so the record matches the report honestly:

- 2026-10-26 — offered step-by-step enablement twice, **declined/skipped** both
  times; recorded as open High.
- 2026-10-27 — owner chose **Enable 2FA now**, and of the three methods offered
  (security key / mobile app TOTP / email) selected **Email Authentication**.

What was done: My Profile → Authentication → Two-Factor Authentication →
`Enable` on the *Email Authentication* row.

Observed behaviour, recorded exactly as it happened: Cloudflare activated the
method **without asking for a confirmation code at enable time** — no QR, no
TOTP entry, no "enter the code we just emailed you" step was presented. The page
immediately showed the row with a `Disable` button. Because an instant UI state
proves nothing on its own, the page was then **fully reloaded** and read back:

```
Two-Factor Authentication
  Email two-factor authentication is active.
Email Authentication   [Disable]
  "Email authentication is active. You will receive authentication codes via
   email when logging in."
```

A second, independent read after another navigation returned the same two facts
(`emailActive: true`, `inactive: false`, `Disable` button present). Status:
**PASS** — a second factor now exists where none did.

**Residual risk, stated rather than glossed over:**

- Email 2FA is the **weakest** of the three available methods: the second factor
  travels to the same mailbox that a password-reset link would also reach, so an
  attacker who already controls the owner's email defeats it. It closes the
  "no second factor at all" gap; it does **not** equal TOTP or a hardware key.
- No backup codes were generated during this run, and **Mobile App (TOTP)** and
  **Security Key** remain unconfigured — both are free (TOTP app) and available
  as a later strengthening step. A hardware key would cost money and is excluded
  by the zero-cost constraint.
- GitHub account 2FA was **not** changed in this engagement and its status is
  **NOT RUN** — not claimed either way.

The codes themselves are never read into any log, file or message by this
assistant; only the owner sees them, in their own mailbox.

### 4.3 Preview deployments restricted — M5

Project → Settings → Preview access now reads:

> Preview deployments are restricted by a Cloudflare Access policy. Visitors must
> sign in and match the policy before viewing previews.

Independently verified at the edge (redirects **not** followed):

| Probe | Result |
|---|---|
| `https://irfanpdf.pages.dev/` (production) | `200` — unaffected |
| `https://irfanpdf.github.io/` (production) | `200` — unaffected |
| `https://<anything>.irfanpdf.pages.dev/` (preview namespace) | `302` → `irfanpdf-pages.cloudflareaccess.com/cdn-cgi/access/login/...`, with `Www-Authenticate: Cloudflare-Access` |

Cloudflare's own documentation states that enabling the access policy "will
restrict viewing project deployments to your Cloudflare account" — i.e. the default
policy is account-members-only, not public. Previews additionally carry
`X-Robots-Tag: noindex` by default, so restricting them also protects SEO from
duplicate content.

Scope note, quoted from the same settings page: this protects preview URLs only;
production `pages.dev` and custom domains are managed separately in Zero Trust.

### 4.4 Notifications — one live alert, the rest assessed honestly

Before this batch: **nothing configured** (empty state, verified).

Created and then re-read back from the list:

```
Incident alert | Cloudflare Status | Incident alert | Email | Enabled
```

All impact levels (None/Minor/Major/Critical), all Cloudflare services, delivered to
the account owner's address (deliberately not written down here). Cost: 0.

Everything else in the catalogue was assessed rather than enabled blindly:

| Alert family | Verdict |
|---|---|
| HTTP DDoS / abuse report / Universal SSL / brand protection / port scans | **NOT APPLICABLE** — every description says "your domains"; needs a zone we do not own |
| Leaked Access Service Token | **NOT APPLICABLE** — no service tokens in use |
| CASB, Log Explorer, Scheduled Query, Image Transformation | **NOT APPLICABLE** — features not in use on this plan |
| Billing budget alert | **NOT APPLICABLE to the goal** — could be added as a zero-spend tripwire; owner selected the incident alert only |
| Page Shield family (malicious scripts, new resource domains) | **NOT RUN** — listed, but applicability without a zone was not verified, so no claim is made |
| Build/deploy failures | **covered elsewhere** — GitHub Actions failure emails already fire on every failed run |

---

## 5. WAF and rate limiting — why this is NOT APPLICABLE today

Three independent facts, all verified:

1. **The account-level WAF is an Enterprise paid add-on.** The dashboard shows
   "Purchase add-on" — so it is out of scope under the zero-cost constraint, and it
   was not purchased.
2. **WAF and rate-limiting rules attach to a zone you control.** This deployment
   owns no zone: the site lives on Cloudflare's own `pages.dev` zone plus GitHub
   Pages, and no custom domain is attached. There is nothing to hang a WAF rule on.
3. **The free plan does include a WAF ruleset — for when a zone exists.**
   Cloudflare's docs: *Cloudflare Free Managed Ruleset* is available on all plans,
   while the broader *Cloudflare Managed Ruleset* and *OWASP Core Ruleset* are
   Pro and above. So if a custom domain is ever added, deploying the free ruleset
   costs nothing; the Pro/Enterprise rulesets remain out of scope.

What protects the site today, all free: Cloudflare's network-level DDoS protection
included with `pages.dev`, our own strict `_headers` policy (hash-constrained CSP,
1,409 chars / 20 hashes on the catch-all), GitHub's DDoS protection on the second
host, plus branch protection, secret scanning and push protection.

`github.io` still sends no custom security headers (M4) — it cannot, without a
Cloudflare zone or a `_headers`-capable host in front of it. Left open.

---

## 6. Decisions taken by the owner (with dates)

| Date | Decision | Consequence |
|---|---|---|
| 2026-10-26 | Authorized GitHub account confirmed; checks use the stored credential read **in memory only** | token never printed or written to disk |
| 2026-10-26 | Push the three baseline commits | deployed, live-verified |
| 2026-10-26 | Push the PII-redaction commit | `4ef39c7` live, checker PASS |
| 2026-10-26 | Apply branch protection as specified (admin bypass on) | H2 closed |
| 2026-10-26 | Take on all six Phase-2 items | §1 table |
| 2026-10-26 | Push the two backup-module commits + run the workflow once | F and F2 closed |
| 2026-10-26 | Restrict preview deployments | M5 closed |
| 2026-10-26 | **Skip Cloudflare 2FA** | H1 stayed open High at that point |
| 2026-10-27 | **Enable Cloudflare 2FA — email method** (owner reversed the skip, chose email over TOTP) | H1 closed as PASS with a recorded weakness note (§4.2) |
| 2026-10-27 | **Nothing may cost money — not ₹1** | all paid options marked NOT APPLICABLE; no purchase attempted |
| 2026-10-27 | Create the incident alert | one notification live and verified |
| 2026-10-27 | **Plan the history rewrite (safe part only)** — inventory + tool + rewrite of a throwaway clone; nothing destructive without a second approval | 25 commits, PII mapped to 4 files + 1 message; clone verified PII-free and byte-identical at `HEAD` |
| 2026-10-27 | **Force-push the rewritten history** (destructive) | `89d15d6` → `62b25d0`; every clone must re-clone; deploy run #18 green |
| 2026-10-27 | **Temporarily allow force pushes** if branch protection blocked it, then re-lock | first push refused with GH006; `allow_force_pushes` toggled → push succeeded → toggled back (read-back: `False`) |
| 2026-10-27 | Rewrite the local safety branch too, but **not** publish it | local-only, now `003b826`, PII-free |
| 2026-10-27 | **Keep pre-rewrite SHAs in the docs** (declined to overwrite historical evidence) | old SHAs stay where they were measured; mapping table in §8.5 |
| 2026-10-28 | **Remove the host default `Access-Control-Allow-Origin: *`** from `pages.dev` (L1) | one `!` detach line; deploy #20; header measured absent on 5 URLs (§9). `github.io` untouched |
| 2026-10-29 | **Replace the over-broad token with a fine-grained PAT limited to 2 repositories** (`irfanpdf.github.io`, `irfanpdf-releases`; Contents R/W + Workflows R/W only) | decided and staged; **application NOT RUN** as of 2026-10-29 15:22 (§10.4) |
| 2026-10-29 | **Revoke the old OAuth grant** once the replacement is proven working | sequenced after the replacement, so pushes never lose auth; not yet reached |

Still undecided, each requiring its own explicit go-ahead:

- **support channel** (currently the `security.txt` advisory form — final or not?);
- **`github.io` future** (keep both hosts, or retire the header-less one);
- H3 signed installers, M4 github.io headers. (M3 token scope **is** decided —
  §10.3; only applying it remains, and it needs the owner to run one command.)
- **strengthen 2FA** — add TOTP (free app) and/or generate + store backup codes;
  email-only was the owner's choice for now (§4.2).
- **old objects on GitHub's side** — the pre-rewrite commits were still
  resolvable by SHA after the push (§8.6); either wait for GitHub's internal GC
  or ask Support to expire them (free).

---

## 7. Re-running the verification yourself

```powershell
# repository controls
gh api repos/irfanpdf/irfanpdf.github.io/branches/main/protection
gh api repos/irfanpdf/irfanpdf.github.io --jq .security_and_analysis

# backup module
node scripts/backup.mjs list
node scripts/backup.mjs verify <dir>
node scripts/backup.mjs restore <dir> --target <staging> --run-tests

# live site (must end PASS with no flag)
node scripts/check-live-headers.mjs https://irfanpdf.pages.dev
node crawl.js https://irfanpdf.pages.dev

# preview restriction (expect 302 to the Access login)
curl -s -o NUL -w "%{http_code} -> %{redirect_url}" https://x.yourproject.pages.dev/

# 2FA status (expect "Email two-factor authentication is active")
#   dash.cloudflare.com/profile/access-management/authentication/two-factor

# backup workflow
#   Actions tab -> backup-and-verify -> most recent run must be green with an artifact

# history rewrite verification: PII must be 0 in contents AND messages of every
# commit. The three real tokens are NOT written down here - substitute them from
# your own password manager / memory when you run it:
#   <local-user>  <previous-username>  <email-domain>
git grep -I -i -l -F -e '<local-user>' -e '<previous-username>' -e '<email-domain>' $(git rev-list --all)
git log --all --format='%B' | Select-String -Pattern '<local-user>|<previous-username>|<email-domain>'
```

---

## 8. History rewrite — M1 history closed (2026-10-27)

### 8.1 What was found before rewriting

An exact inventory across all 25 commits on both refs, contents **and** commit
messages, produced by running `git grep` over every revision. Output was masked
as it printed, so no token ever reached a terminal line, a log or a file:

| Token | Files carrying it in history | Commit messages |
|---|---|---|
| local username path | 5 — `BACKUP-RESTORE.md`, `WEBSITE-ANALYSIS.md`, `README.md`, `PUBLISH-GITHUB.md`, `VERIFICATION-REPORT.md` | 1 — `0c3512e0` |
| previous account name | 2 — `CLOUDFLARE-PAGES-MIGRATION.md`, `PUBLISH-GITHUB.md` | 0 |
| email address | 1 — `CLOUDFLARE-PAGES-MIGRATION.md` | 0 |
| Cloudflare account id | 0 | 0 |

At `HEAD` every token was already 0 — this rewrite targets history only.
(Note: the earlier impression of "19 commits" was 19 *snapshots* of one file
that carried the old name from `f3ab65c` until `4ef39c7` removed it; the real
blast radius is 4 files + 1 message.)

### 8.2 How it was done

1. **Backup first:** `irfan-20261027-105446`, 153 files, head `89d15d6`
   (pre-rewrite), self-verify PASS — a rollback existed before anything changed.
2. `git clone --mirror` into a temp directory. The working repository and
   `origin` were **not** touched while the rewrite itself ran.
3. `git filter-repo --replace-text … --replace-message … --prune-empty never`
   with four **literal** replacements. The replacement file contained only
   placeholders — the real values were never written to disk by this step.
4. Verified inside the clone:
   - 0 hits for every token in contents **and** messages across all 25 commits;
   - 85 paths at `HEAD` identical to the working repository;
   - **0 blobs differ at `HEAD`** — the final tree is byte-identical, so the
     served site cannot change as a result of this;
   - `typecheck` exit 0, **206 passed / 0 failed**, full build exit 0 with the
     same `1409 chars / 20 hashes` catch-all CSP as production.
5. Only after all of that: the force-push (§8.3).

`--prune-empty never` mattered. With the default setting, the commit
*"DOCS: redact a local username path that this batch itself introduced"*
became an empty diff after the global redaction and was silently dropped —
25 commits became 24. Re-running with `--prune-empty never` kept all 25, so the
record of that mistake survives (new SHA `34ea708`).

### 8.3 The force-push, including the block it hit

First attempt was refused by branch protection, exactly as it was configured:

```
remote: error: GH006: Protected branch update failed for refs/heads/main
remote: - Cannot force-push to this branch
 ! [remote rejected] main -> main (protected branch hook declined)
```

The owner had pre-approved toggling force-pushes if this happened. Settings were
then changed through the API flipping **only** `allow_force_pushes`
(read-back before the push: force-push `false`, `enforce_admins` `false`,
PR required with 0 approvals, deletions `false`), the push was retried:

```
+ 89d15d6...62b25d0 main -> main (forced update)
```

and the setting was re-locked and read back immediately:
`allow_force_pushes=False`, `allow_deletions=False`, `enforce_admins=False`,
PR required with 0 approvals — the same posture as before, with the temporary
change reverted.

### 8.4 Verification after the push

| Check | Result |
|---|---|
| deploy run **#18** (`62b25d0`) | success |
| `check-live-headers.mjs` | `OVERALL: PASS` (no flag) |
| `crawl.js` | `OVERALL: PASS` |
| both hosts + both `security.txt` | 200 |
| preview namespace | 302 (still Access-locked) |
| local `HEAD` / `origin/main` | `62b25d0` / `62b25d0`, clean, 0 ahead |
| commits reachable from any ref | 25; old `89d15d6` not among them |
| PII across all refs (contents + messages) | 0 for all three tokens |
| local safety branch | repointed to `003b826`, still local-only |

### 8.5 SHA mapping (old → new)

All 25 commit subjects matched 1:1. Pre-rewrite SHAs still appear in five
documents as **historical evidence** — *"Actions run #10 (`3f204c5`)"*, the
backup manifest line `head=4ef39c7`, *"deployed from commit `c743f96`"`. Those
were deliberately **not** rewritten: replacing them with new SHAs would make the
records false, because the new commits never appeared in run #10 or in that
manifest.

| Old (pre-2026-10-27) | New equivalent |
|---|---|
| `89d15d6` (old `main` head) | `62b25d0` |
| `5d2a8d9` | `34ea708` |
| `4ef39c7` | `7f94a46` |
| `40d9730` | `6c1b77e` |
| `3f204c5` | `592e106` |
| `c743f96` | `ea3f40e` |
| `98d04aa` | `eca39e3` |
| `0c3512e0` | `243b9e2` |

The old commits themselves remain readable **inside the local backup bundles**,
so an old citation can still be resolved offline.

### 8.6 Residual risk after the rewrite (measured, not assumed)

- **The old commits are still resolvable on GitHub by direct SHA.** Measured
  after the force-push: `89d15d64…` → HTTP 200, `0c3512e0` → HTTP 200. The
  branches are rewritten, but GitHub keeps the now-unreachable objects until
  its internal GC runs — timing not under our control. So the PII is off every
  branch, and still fetchable by anyone who already knows a SHA. Options: wait
  for GC, or ask GitHub Support to expire them (free). Both are open items.
- Local clones still hold the old objects in their **reflog** (`git fsck` shows
  0 unreachable only because reflogs count as roots). The `SECURITY_BACKUPS`
  bundles deliberately keep the pre-rewrite history for rollback — they are
  private local files. Purging the local reflog is a separate optional decision.
- **Every clone of this repository must be re-cloned**; old SHAs cited
  externally will not resolve against the remote.

---

## 9. L1 — removing the host's default `Access-Control-Allow-Origin` (2026-10-28)

### 9.1 The finding, and an assumption that had gone untested

Both hosts served `Access-Control-Allow-Origin: *` on every response. The written-up
position (finding S2 / L1, and `SECURITY-HARDENING.md` §7 item 7) was that it comes from
the host's own defaults and is **not configurable from this repository** — while that same
text admitted "the exact Cloudflare-side mechanism was not verified". So the claim was an
assumption, never a measurement.

### 9.2 What the documentation actually says

From Cloudflare's `_headers` documentation:

> The default response headers served on static asset responses can be **overridden,
> removed, or added to** … Headers defined in the `_headers` file **override** what
> Cloudflare ordinarily sends.

> **Detach a header** — … This can be done by prepending the header name with an
> exclamation mark and space (`!`).

Two consequences: the header **is** configurable from this repository, and it can be
*removed* rather than merely overwritten with a narrower value.

### 9.3 The change

One functional line in `scripts/gen-headers.mjs`'s `OTHER_HEADERS` array:

```
! Access-Control-Allow-Origin
```

Because that array lands on the `/*` catch-all rule, the detach applies to every URL.
Locally verified before pushing: exactly one detach line in the regenerated `out/_headers`,
zero `Access-Control-Allow-Origin: <value>` lines, 58 rules (limit 100), longest line
1,436 chars (limit 2,000), catch-all CSP unchanged at 1,409 chars / 20 hashes;
`typecheck` 0, 206 passed / 0 failed, `build` 0.

### 9.4 Why this was safe, not merely hoped to be safe

- The same `/*` rule already sends `Cross-Origin-Resource-Policy: same-origin` (and
  `Cross-Origin-Opener-Policy: same-origin`), which **already** prevented other origins
  from reading these responses. The `*` was advertising a freedom browsers were not
  granting, so no legitimate cross-origin consumer could have been working before that
  this change breaks.
- No source file, test or checker in the repository asserted or required the header —
  checked `scripts/check-live-headers.mjs`, `crawl.js` and the assistant test suite.

### 9.5 Live evidence (deploy run #20, `1eb5e3e`)

| URL on `irfanpdf.pages.dev` | `Access-Control-Allow-Origin` | `Cross-Origin-Resource-Policy` |
|---|---|---|
| `/` | **absent** | `same-origin` |
| `/docs/contact/` | **absent** | `same-origin` |
| `/sitemap.xml` | **absent** | `same-origin` |
| `/.well-known/security.txt` | **absent** | `same-origin` |
| `/this-route-does-not-exist/` (404 catch-all) | **absent** | `same-origin` |

All nine other security headers (HSTS, `nosniff`, `X-Frame-Options`, Referrer-Policy,
Permissions-Policy, COOP, CORP, `X-Permitted-Cross-Domain-Policies`, CSP) measured
**present**. `check-live-headers.mjs` → `OVERALL: PASS`; `crawl.js` → `OVERALL: PASS`;
both hosts and both `security.txt` → 200; preview namespace → still `302`.

For contrast, `irfanpdf.github.io` still sends `Access-Control-Allow-Origin: *` — that is
GitHub Pages' own default and cannot be changed from this repository (open finding M4).

### 9.6 Limits, stated plainly

- This closes L1 **for `irfanpdf.pages.dev` only.**
- `_headers` rules are not applied to responses generated by Pages Functions; this project
  is fully static, so that does not apply — but a future SSR/Functions move would need the
  header set in code instead.
- The `*` was Low severity to begin with; removing it reduces a real (if small) exposure
  and closes a documentation inaccuracy, and nothing more. It is not a substitute for the
  items still open.

---

## 10. M3 — over-broad token scope (measured 2026-10-29; **remediation not applied**)

### 10.1 What the credential actually is

Read from Windows Credential Manager **in memory only**. The value was never printed,
logged or written to disk — only its type prefix and length were taken.

| Property | Measured |
|---|---|
| Type | OAuth access token — prefix `gho_`, 40 characters. **Not a PAT**, so it cannot be narrowed; it can only be replaced |
| Scopes (`X-OAuth-Scopes` on `/user`) | `gist`, `repo`, `workflow` |
| Repositories visible | 3, every one with full administrative rights |
| Private repositories today | 0 |
| Where git reads it | the `github.com` credential entry git queries on push; a second entry exists that git's helper *writes back* to (distinguished by reading the store and watching which entry changed after a git operation) |
| Age of the entry git reads | last written `2026-10-22 17:36:16` |

### 10.2 Why it is more than this project needs

- **`repo`** — read/write across every repository the account can reach, **including any
  private repository created later**, plus repository administration (webhooks,
  collaborators, settings). What the project actually needs: read/write on two named
  repositories.
- **`workflow`** — editing Actions workflow files. **Legitimately used here**:
  `.github/workflows/backup.yml` is pushed from this repository, and a commit touching a
  workflow file is rejected without it.
- **`gist`** — creating and editing gists. Unrelated to this project; the clearest
  least-privilege violation in the set.

Exposure if this credential ever leaked: account-wide write authority plus an unrelated
gist capability, extending silently to any future private repository. The practical
exposure is currently limited by the fact that no private repositories exist — that is a
circumstance, not a control.

### 10.3 Decisions taken by the owner (2026-10-29)

1. Replace it with a **fine-grained personal access token** scoped to exactly
   `irfanpdf.github.io` and `irfanpdf-releases`, permissions **Contents: read/write** and
   **Workflows: read/write** (Metadata auto-granted read-only), with an expiry date.
2. **Revoke the old OAuth grant** (Settings → Applications → Authorized OAuth Apps) only
   *after* the replacement is proven to work, so authentication is never lost in between.

### 10.4 Remediation status — NOT RUN (measured, not assumed)

**Status as of 2026-10-29 15:22 local: NOT APPLIED.** Every check between 14:44 and
15:22 on 2026-10-29 read the credential store and the GitHub API directly, and every one
returned the identical unchanged state:

- stored credential `gho_`, 40 characters; entry last written `2026-10-22 17:36:16`;
- no receipt file produced by the verification script;
- `/user` still reports `gist, repo, workflow`;
- still HTTP 200: gists, the full repository listing, an unselected third repository,
  repository administration, webhooks, and the branch-protection endpoint.

Two distinct causes, both real: the first attempts failed because **the replacement token
had not been created yet**, so there was nothing to store; later attempts did not land
either — the final check polled the credential entry every 10 seconds for 4 minutes with
no change.

Honest framing: this is a hardening step that has **not been carried out**, not a control
that was claimed and later found missing. **Nothing is broken by it** — git
authentication, the deploy workflow and the live site are unaffected, and no additional
exposure is accruing: the credential is the same one in place since 2026-10-22.

### 10.5 Staged and ready for when it is run

- **Target** — the credential entry git actually reads on push, established by reading
  the store and observing which entry git's helper writes back to, rather than assumed.
- **`set-git-pat.ps1`** (local tooling) — refuses to run under a Windows account other
  than the verifier's (each account has its own credential store, so a run elsewhere is
  invisible to the verifier), writes both entries, requires the primary entry to read back
  a value that is **not** the old token, runs `git ls-remote`, re-reads afterwards to
  catch reversion, and leaves a receipt file containing **no secret** — prefix, timestamps
  and verdict only.
- **One-line alternative** — `cmdkey /generic:git:https://github.com /user:irfanpdf
  /pass`, where `/pass` with no value is what makes it prompt.
- **Pass criteria for the next check**: entry timestamp moves off `2026-10-22`; prefix
  becomes `github_pat_`; `/user` no longer reports `gist, repo, workflow`; gists,
  repository listing, the unselected repository, administration, webhooks and branch
  protection all blocked; both selected repositories `200`; `git push --dry-run` succeeds.

### 10.6 Errors made on this item and caught in session

Disclosed because this record must state mistakes, and none of these were harmless by
default:

1. **A success gate that could not fail.** The first verification script declared success
   on any successful write plus a `git ls-remote` — and the *old* token satisfied that
   probe too, so it could report success without proving anything. Replaced with a gate
   requiring the primary entry to read back a non-old value before **and** after the
   probe.
2. **12 characters of the old token were printed** instead of 4, from an oversized
   substring in a diagnostic line. The old token is exactly the credential scheduled for
   revocation, which limits the impact but does not excuse it.
3. **A username-masking regex failed**, printing an unmasked local username where
   `<local-user>` was required.
4. **A timestamp was rendered wrongly** (hand-rolled `FILETIME` conversion), corrected to
   `DateTime.FromFileTime`.
5. **Three PowerShell parsing mistakes** (`$Matches` clobbered by a second `-match`, plus
   two fragile parses) produced "none found" where entries existed; each was re-run
   correctly once the error was spotted.

None of these touched the repository, the live site or any remote configuration.

*No scan or test can guarantee freedom from viruses on any device, including
visitors' machines. This document records what was run, and what was not.*
