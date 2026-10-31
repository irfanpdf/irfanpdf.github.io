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
| H1 | Cloudflare account 2FA | **PASS** (email + TOTP + backup codes) | Re-read from `/profile/access-management/authentication/two-factor` after a full reload: *"Email two-factor authentication is active"*, button reads `Disable` (§4.2). **Strengthened 2026-10-31:** TOTP enrolled (`Reconfigure`) + backup codes generated (`Regenerate`), verified by labels-only read + a working authenticator-app challenge at the next sign-in (§4.2) |
| GH-2FA | GitHub account 2FA | **PASS** (TOTP + recovery codes + passkey; **owner-reported**, not API-verifiable) | Enabled 2026-10-29; owner read back Settings → Password and authentication showing `Disable two-factor authentication`, recovery codes saved, passkey added. The API cannot confirm it — `/user` returns no 2FA field and GraphQL rejects `viewer.twoFactorAuthentication` (§11.4) |
| H2 | Branch protection on `main`, both repos | **PASS** | Read back from the API: PR required, 0 approvals, no force-push, no deletions, admin bypass retained |
| H3 | Releases repo: signed installers | **OPEN** | Not part of this batch; unchanged from the Phase 1 finding |
| M1 | Personal data in tracked docs | **PASS** (tree) / **PASS** (history, with a server-side caveat) | `git grep` at `HEAD` → 0; history rewritten 2026-10-27 → 0 in contents and messages across all 25 commits (§8). Caveat: old objects were still resolvable by SHA after the push (§8.6) |
| M2 | Dependabot alerts + security updates | **PASS** | `vulnerability-alerts` and `automated-security-fixes` enabled and read back `enabled` on both repos |
| M3 | Over-broad token scope | **OPEN** — measured, decided, **not applicable from this environment** | Credential measured in memory: OAuth token (`gho_`, 40 chars), scopes `gist, repo, workflow`, account-wide, admin on all 3 repos (§10.1). Owner chose a fine-grained PAT on 2 repos + revoking the old grant (§10.3). Replacement **NOT APPLIED** — every check on 2026-10-29 between 14:40 and 16:50 read back the old token, entry untouched since 2026-10-22; cause: no shell available in the owner's environment (§10.4) |
| M4 | `github.io` sends no custom headers | **PASS** (closed by retiring the host, 2026-10-30) | GitHub Pages **unpublished** → the host now returns `404` on `/`, `/features/`, `/sitemap.xml` and `/security.txt`, so it serves no page that could lack headers (§12). The underlying limitation stands: that host *cannot* serve custom headers — retiring it was the only in-repo route to closing this (§12.2) |
| M5 | Preview deployments publicly readable | **PASS** | "Restricted by a Cloudflare Access policy" in settings + live `302` to the Access login at the edge (§4.3) |
| L1 | `Access-Control-Allow-Origin: *` on every response | **PASS** (both hosts) | `!` detach rule on `pages.dev`: header measured **absent** on 5 live URLs incl. the 404 catch-all, other 8 headers intact, checker + crawl PASS (§9). `github.io` half closed 2026-10-30 by unpublishing: header measured **absent** there too, because the host now 404s (§12) |
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
| 2FA | **Active — email + TOTP + backup codes** (email since 2026-10-27; TOTP + backup codes added 2026-10-31, H1/§4.2) |

### 4.2 Cloudflare 2FA — H1 (enabled 2026-10-27, email method; **strengthened 2026-10-31 to email + TOTP + backup codes**)

Timeline, so the record matches the report honestly:

- 2026-10-26 — offered step-by-step enablement twice, **declined/skipped** both
  times; recorded as open High.
- 2026-10-27 — owner chose **Enable 2FA now**, and of the three methods offered
  (security key / mobile app TOTP / email) selected **Email Authentication**.
- 2026-10-31 — owner reversed the "email is enough" position and **added Mobile
  App (TOTP) + generated backup codes** (see *2026-10-31 strengthening* below).

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
- ~~GitHub account 2FA was **not** changed in this engagement and its status is
  **NOT RUN** — not claimed either way.~~ **Superseded 2026-10-29:** GitHub
  account 2FA **was** enabled afterwards (TOTP + recovery codes + passkey) —
  §11. This line is kept visible rather than deleted so the record shows what
  was true when it was written.

**2026-10-31 strengthening — email + TOTP + backup codes (all free):**

The two weaknesses above were closed the same way everything else in this
engagement is closed: by measuring, not by asserting. The owner enrolled a
**free authenticator app** (TOTP) and generated **backup codes**, both at ₹0.

How it went, including the misfires:

- One enrollment attempt was **abandoned by the owner after a screenshot of
  the QR code was posted into this chat** — the assistant disclosed that the
  image contained the TOTP secret, never scanned/decoded it, and recommended
  discarding that QR. A **fresh QR** was then enrolled instead, so the secret
  that appeared in the chat was never the one that ended up configured.
- Verification used the **labels-only guarded page read** used elsewhere in
  this record (section heading → adjacent control label, plus booleans for
  "QR visible" / "code list visible") so no secret could surface in any tool
  output. Measured state change on
  `/profile/access-management/authentication/two-factor`:

| Method | Before (2026-10-30) | After (2026-10-31, read back) |
|---|---|---|
| Mobile App Authentication (TOTP) | `Add` | **`Reconfigure`** → enrolled |
| Backup codes | `Generate` | **`Regenerate`** → generated |
| Email Authentication | `Disable` (active) | `Disable` (active, unchanged) |
| Security Key Authentication | `Add` | `Add` (not configured — out of scope, costs money) |

- **End-to-end proof, not just a UI state:** after a session restart forced a
  fresh sign-in, the login step-up challenge presented was
  *"Verify with your authenticator app"* (not the email fallback), and the
  owner entered a working code from the app — **owner-confirmed**. That
  proves the configured TOTP both exists and produces valid codes at login.
- Backup codes were generated and are **owner-saved** (password manager /
  paper — never read into this session; the assistant is structurally barred
  from seeing them). One honest limit: *where* they are stored cannot be
  verified from here, only the owner knows.
- Residual notes kept honest: `Security Key Authentication` remains `Add`
  (a hardware key costs money → excluded by the zero-cost rule), and anyone
  holding the discarded QR from the chat screenshot could generate codes for
  the *abandoned* enrollment only — that secret was never activated, which is
  exactly why it was discarded and redone.

Status after strengthening: **PASS — email + TOTP + backup codes.** H1's
recorded weakness ("email-only, no backup codes") is closed. Cost: ₹0.

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

~~`github.io` still sends no custom security headers (M4) — it cannot, without a
Cloudflare zone or a `_headers`-capable host in front of it. Left open.~~
**Superseded 2026-10-29 → 2026-10-30:** the host was unpublished instead, so
neither M4 nor L1 can apply to it any more (§12). The platform limitation
itself remains true — GitHub Pages still cannot serve custom headers.

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
| 2026-10-31 | **Strengthen Cloudflare 2FA — add TOTP + generate backup codes** (free authenticator app, owner reversed the "email is enough" position) | Measured: `Mobile App` `Add` → **`Reconfigure`**, `Backup codes` `Generate` → **`Regenerate`**; end-to-end proof via a working authenticator challenge at the next sign-in; H1's weakness note closed. Cost ₹0 (§4.2) |
| 2026-10-31 | **Create a free mobile companion app** (Expo/Expo Go, both phones; owner chose companion-app scope over a PDF toolkit, private repo placement over a site-repo subfolder; PWA route declined earlier the same day) | Built and verified locally (tsc 0, expo export both platforms, expo-doctor 20/20, content drift 0, PII 0); source **kept local, not pushed** per owner decision; website untouched. Full record: `MOBILE-COMPANION-APP.md`. Cost ₹0 |
| 2026-10-27 | **Nothing may cost money — not ₹1** | all paid options marked NOT APPLICABLE; no purchase attempted |
| 2026-10-27 | Create the incident alert | one notification live and verified |
| 2026-10-27 | **Plan the history rewrite (safe part only)** — inventory + tool + rewrite of a throwaway clone; nothing destructive without a second approval | 25 commits, PII mapped to 4 files + 1 message; clone verified PII-free and byte-identical at `HEAD` |
| 2026-10-27 | **Force-push the rewritten history** (destructive) | `89d15d6` → `62b25d0`; every clone must re-clone; deploy run #18 green |
| 2026-10-27 | **Temporarily allow force pushes** if branch protection blocked it, then re-lock | first push refused with GH006; `allow_force_pushes` toggled → push succeeded → toggled back (read-back: `False`) |
| 2026-10-27 | Rewrite the local safety branch too, but **not** publish it | local-only, now `003b826`, PII-free |
| 2026-10-27 | **Keep pre-rewrite SHAs in the docs** (declined to overwrite historical evidence) | old SHAs stay where they were measured; mapping table in §8.5 |
| 2026-10-28 | **Remove the host default `Access-Control-Allow-Origin: *`** from `pages.dev` (L1) | one `!` detach line; deploy #20; header measured absent on 5 URLs (§9). `github.io` untouched |
| 2026-10-29 | **Replace the over-broad token with a fine-grained PAT limited to 2 repositories** (`irfanpdf.github.io`, `irfanpdf-releases`; Contents R/W + Workflows R/W only) | decided and staged; **NOT APPLIED** — no shell available in the owner's environment, checked through 2026-10-29 16:50 (§10.4) |
| 2026-10-29 | **Park the M3 application** rather than keep attempting it | stays OPEN and honestly recorded; needs a machine/session where a command or the Credential Manager GUI can actually be used |
| 2026-10-29 | **Revoke the old OAuth grant** once the replacement is proven working | sequenced after the replacement, so pushes never lose auth; not yet reached |
| 2026-10-29 | **Enable GitHub account 2FA** (previously declined, then NOT RUN) — TOTP app + recovery codes + passkey | High finding closed as PASS, **owner-reported** and explicitly not API-verifiable (§11). Cost ₹0 |
| 2026-10-30 | **Retire `irfanpdf.github.io`** — unpublish the GitHub Pages site (Option A chosen over redirect stubs / keep-both, after the API's 422 proved a settings-toggle disable impossible for a user-site repo) | host measured `404` on 4 routes; `ACAO: *` **absent** → M4 and the `github.io` half of L1 closed (§12). `pages.dev` untouched at `200` |
| 2026-10-30 | **Disable the `deploy-site-to-pages` workflow** (disable, not delete — GitHub warned the site "will not prevent it from being rebuilt") | `state=disabled_manually`, read back; `backup-and-verify` still `active` (§12.3). Reversible |

Still undecided, each requiring its own explicit go-ahead:

- **support channel** (currently the `security.txt` advisory form — final or not?);
- ~~**`github.io` future** (keep both hosts, or retire the header-less one);~~
  **Decided 2026-10-30: retired** — unpublished, workflow disabled (§12).
- H3 signed installers. (M4 github.io headers: **closed by retirement 2026-10-30** —
  §12.)
- **applying the M3 remediation** — the scope decision is settled (§10.3) and the
  tooling is staged (§10.5), but it needs a machine or session where the owner can
  actually run a command or open Credential Manager; none of the three routes
  (PowerShell, `cmd`, GUI) was executable here (§10.4). Decide whether to attempt
  it from another session or leave it parked.
- ~~**strengthen 2FA** — add TOTP (free app) and/or generate + store backup codes;
  email-only was the owner's choice for now (§4.2). *This applies to the
  **Cloudflare** account; the **GitHub** account now has TOTP + codes + passkey
  (§11).*~~ **Decided 2026-10-31: done for Cloudflare** — TOTP enrolled +
  backup codes generated + a working authenticator challenge observed at login
  (§4.2). The **GitHub** account already had TOTP + codes + passkey (§11).
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

# 2FA status (expect "Email two-factor authentication is active",
#   Mobile App row -> "Reconfigure", Backup codes row -> "Regenerate")
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
*(Superseded 2026-10-30: that host is unpublished now and returns `404` with no such
header — measured in §12.)*

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

### 10.4 Remediation status — NOT APPLIED (measured, not assumed)

**Status as of 2026-10-29 16:50 local: NOT APPLIED.** Every check on 2026-10-29
between **14:40 and 16:50** read the credential store and the GitHub API directly —
nine verification rounds in total — and every one returned the identical unchanged
state:

- stored credential `gho_`, 40 characters; the entry git reads last written
  `2026-10-22 17:36:16` (a week before this session);
- no receipt file produced by the verification script;
- `/user` still reports `gist, repo, workflow`;
- still HTTP 200: gists, the full repository listing, an unselected third repository,
  repository administration, webhooks, and the branch-protection endpoint.

**The real cause, stated plainly:** the remediation step was **never executable in the
owner's environment** — the owner reported *"I can't run PowerShell here"*. Three
routes were attempted in sequence, and none produced any change in the credential
store, each confirmed by watching the entry every 10 seconds for 4–7 minutes:

1. a PowerShell script (`set-git-pat.ps1`, identity-gated, receipt-writing);
2. `cmd` with `cmdkey … /pass` (a native Windows utility, offered after PowerShell was
   reported unavailable);
3. the Credential Manager GUI (`control /name Microsoft.CredentialManager`, editing the
   existing entry in place — no command prompt at all).

A secondary, earlier cause was also real: the first attempts preceded the creation of
the replacement token, so there was nothing to store at that point. Either way the
measured end state is the same. The owner's own account of what happened changed
across the session — four completion reports, then the honest answer that nothing had
been run — and this record relies on the **machine measurements**, which were
consistent throughout, rather than on any of those reports.

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
- **No-shell alternative** — Credential Manager GUI (`Win+R` →
  `control /name Microsoft.CredentialManager` → Windows Credentials → the entry with
  address exactly `git:https://github.com`, not the `irfanpdf@` duplicate → Edit →
  paste into Password → Save). Attempted 2026-10-29; also produced no change (§10.4).
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

---

## 11. GitHub account 2FA — enabled 2026-10-29 (owner-reported)

The brief did not assign this an ID; it is labelled **GH-2FA** here. It was the
remaining High-severity account-level control — Cloudflare's equivalent is H1
(§4.2), and GitHub's had been recorded as **NOT RUN**.

### 11.1 What the documentation says (checked 2026-10-29, not relied on from memory)

- Two-factor authentication is configured with a **TOTP app** (recommended) or, where
  offered, by text message.
- **Passkeys and security keys may only be added after 2FA is already configured** —
  they cannot be the first method.
- **Recovery codes** are downloaded during setup and can be regenerated later; GitHub
  recommends keeping more than one method configured.
- Critically: *"having access to the email address alone isn't enough to bypass 2FA"*,
  and **GitHub Support cannot restore access when all 2FA credentials and recovery
  methods are lost**. The recovery codes are load-bearing, not a formality.
- There is **no email-based** 2FA option on GitHub, so the choice made for Cloudflare
  (email, H1) was not available here.

### 11.2 What was done (2026-10-29, all free)

1. A TOTP application (free) was configured and its code verified on GitHub.
2. **Recovery codes were downloaded and stored by the owner.** They are never shown to
   this assistant, never written into any log, file, message or archive — consistent
   with `BACKUP-RESTORE.md` §7, which deliberately excludes them.
3. A **passkey** was added as a second method, satisfying both password and 2FA at
   sign-in.

Cost: **₹0** — no plan upgrade, no paid add-on, no payment method.

### 11.3 Why this cannot be verified through the API (measured)

| Route attempted | Result |
|---|---|
| REST `GET /user` with the stored credential | **no 2FA field present at all** — the key is absent from the body, so it is neither `true` nor `false` |
| GraphQL `viewer { twoFactorAuthentication }` | **rejected**: `Field 'twoFactorAuthentication' doesn't exist on type 'User'` (the field is organisation-scoped, not on the base user object) |
| In-app browser → `github.com/settings/…` | the page now loads (an earlier certificate error no longer occurred), but that browser session is **not signed in**, so GitHub returns 404 for settings — no independent read |
| git / HTTP probes | not applicable by design: HTTPS operations use the stored token, which 2FA does not invalidate (confirmed — `git ls-remote` and `git push --dry-run` still succeed) |

### 11.4 Verification used, stated exactly

**Owner-reported.** The owner opened Settings → **Access → Password and
authentication** in their own browser and read the Two-factor authentication section,
reporting that it shows `Disable two-factor authentication` — i.e. 2FA is on — with
recovery codes saved and a passkey added.

This is **weaker evidence than H1**, which was re-read from the Cloudflare page itself.
It is recorded as **PASS (owner-reported, not API-verified)** so that nobody reading
this later mistakes it for an independent measurement.

**What this does not establish:**

- that the recovery codes are stored somewhere the owner can still reach (only the
  owner can know);
- that the passkey still authenticates (it has not been exercised);
- whether the recovery codes remain valid if 2FA is ever reconfigured — regenerating
  codes invalidates the previous set.

### 11.5 Residual risk and what remains open

- With TOTP **and** a passkey **and** recovery codes there is no single point of
  failure, but losing the authenticator device *and* the codes together means GitHub
  Support cannot help — the account would be unrecoverable in that scenario.
- ~~The **Cloudflare** account still has email-only 2FA with no backup codes generated
  (§4.2) — a separate account, separate follow-up, still free to fix.~~
  **Closed 2026-10-31:** Cloudflare now has email + TOTP + backup codes (§4.2),
  so both accounts carry TOTP with codes stored and neither depends on a single
  method.

---

## 12. Retiring `irfanpdf.github.io` — M4 and L1's second half (2026-10-30)

### 12.1 What was decided, and over what

Three options were put to the owner with their trade-offs written out: **retire the
host** (closes both findings, old links break, reversible), **redirect stubs** (links
survive as a soft redirect, but GitHub's default `ACAO: *` rides on stub responses too,
so the findings would *not* close), and **keep both** (findings stay open forever). The
owner chose **retire** — the only route that actually closes M4 and L1 together — on
2026-10-30.

The SEO objection that had kept "run both" in force since 2026-10-25 was re-checked
rather than assumed: canonical, `og:url` and all 17 sitemap entries already pointed at
`pages.dev` on both hosts, and the built site contained **zero** references to the
`irfanpdf.github.io` host (the only matches are repo URLs inside `security.txt`, which
are `github.com/irfanpdf/…` links, unaffected by retiring Pages).

### 12.2 The route GitHub forced, measured

The plan's premise — "one settings toggle" — was **wrong**, and the record says so:

| Attempt | Result |
|---|---|
| `DELETE /repos/irfanpdf/irfanpdf.github.io/pages` (REST) | **HTTP 422** — *"Deactivating GitHub pages for this repository is not allowed."* Config read back unchanged (`status: built`) |
| GitHub community discussion #22018 (checked) | confirms user-site repos (`<username>.github.io`) cannot be deactivated this way |
| Settings → Pages → **Unpublish site** (owner signed in; UI is the supported route for user sites) | **"GitHub Pages unpublished."** |

GitHub's own confirmation dialog is quoted because it shaped the next step:
*"Unpublishing will remove this GitHub Pages site and prevent it from being served, but
it will not prevent it from being rebuilt. To completely disable the site, remove the
GitHub Actions workflow that builds the page."*

### 12.3 The second step — stopping the rebuild (approved separately)

Instead of deleting the workflow file (which would remove source the brief says to
preserve), the workflow was **disabled**, keeping it reversible:

| Workflow | Before | After (read back) |
|---|---|---|
| `deploy-site-to-pages` (`.github/workflows/deploy.yml`) | `active` | **`disabled_manually`** |
| `backup-and-verify` | `active` | `active` (untouched) |
| `pages-build-deployment` (GitHub's own) | `active` | `active` (untouched) |

Method note: the first disable call used `POST` and returned **404** (wrong verb for
that route); `PUT` returned **204**. Caught by reading the state back rather than by
assuming — the read-back is what shows `disabled_manually`.

### 12.4 Before/after, measured live

| URL | Before | After (2026-10-30 10:40) |
|---|---|---|
| `https://irfanpdf.github.io/` | `200` + `ACAO: *` + HSTS, no CSP/nosniff/XFO | **`404`** |
| `…/features/` | `200` | **`404`** |
| `…/sitemap.xml` | `200` | **`404`** |
| `…/security.txt` | `200` | **`404`** |
| `Access-Control-Allow-Origin` | `*` (GitHub default) | **absent** |
| GitHub's 404 response headers | — | restrictive CSP (`default-src 'none'; style-src 'unsafe-inline'; img-src data:; connect-src 'self'`), no ACAO, no HSTS, no body-level scripts |
| `https://irfanpdf.pages.dev/` | `200` | **`200` — untouched** |

### 12.5 What this closes — and how it closes it

- **M4 → PASS**, and **L1 (`github.io` half) → PASS** — but honestly: they close
  because **the content is gone**, not because that host was ever hardened. If the site
  is ever re-published there without a header-capable layer in front, both findings
  **reopen immediately**. The platform limitation behind them (GitHub Pages serves no
  custom headers from the repository) is unchanged and still true.
- SEO/links: any external link to `irfanpdf.github.io` now lands on GitHub's 404.
  Third-party references cannot be inventoried from here — search engines and referrers
  know, not this session.

### 12.6 Rollback (owner-only, ~2 minutes, no data touched)

1. Settings → Pages → **Publish site** (the site rebuilds from the same `main`);
2. Actions → `deploy-site-to-pages` → **Enable workflow**;
3. verify: `node scripts/check-live-headers.mjs` / `node crawl.js` are for `pages.dev`;
   for `github.io` re-check `/` returns `200`.

The repository itself was never modified for this retirement: no commit, no file
change, no protection/Dependabot/visibility change — only Pages publishing state and a
workflow enable-flag, both on GitHub's side, both reversible.

*No scan or test can guarantee freedom from viruses on any device, including
visitors' machines. This document records what was run, and what was not.*
