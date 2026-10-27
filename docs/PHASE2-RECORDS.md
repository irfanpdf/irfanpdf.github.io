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
| M1 | Personal data in tracked docs | **PASS** (tree) / **OPEN** (history) | `git grep` for the PII tokens at `HEAD` → 0 matches; the strings still exist in pushed history (§6) |
| M2 | Dependabot alerts + security updates | **PASS** | `vulnerability-alerts` and `automated-security-fixes` enabled and read back `enabled` on both repos |
| M3 | Over-broad token scope | **OPEN** | Unchanged; checks continue to use the stored credential read in-memory only |
| M4 | `github.io` sends no custom headers | **OPEN** | Unchanged — that host is Cloudflare-free, so it serves no `_headers` (§5) |
| M5 | Preview deployments publicly readable | **PASS** | "Restricted by a Cloudflare Access policy" in settings + live `302` to the Access login at the edge (§4.3) |
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

**Honest boundary:** this fixes the current tree only. The same strings remain in
pushed git history (4 commits touch the old account name; 1 commit message contains
a local filesystem path). Purging them requires a history rewrite + force-push,
which rewrites every commit, breaks every clone and forces both hosts to rebuild.
That stays a separate, explicitly-confirmed decision — §6.

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

Still undecided, each requiring its own explicit go-ahead:

- **history rewrite** to purge the PII from pushed history (destructive: rewrite +
  force-push + both hosts rebuild + every clone breaks);
- **support channel** (currently the `security.txt` advisory form — final or not?);
- **`github.io` future** (keep both hosts, or retire the header-less one);
- H3 signed installers, M3 token scope, M4 github.io headers.
- **strengthen 2FA** — add TOTP (free app) and/or generate + store backup codes;
  email-only was the owner's choice for now (§4.2).

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
```

*No scan or test can guarantee freedom from viruses on any device, including
visitors' machines. This document records what was run, and what was not.*
