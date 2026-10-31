# Mobile companion app (Expo) — created 2026-10-31

A **free companion app** for Irfan PDF was built on 2026-10-31. This document
records what it is, how it was verified, where its source lives, and — because
this project's standard is written honesty — exactly what it is **not**.

Cost to build: **₹0.** Cost to run: **₹0.** No store listing, no developer
account, no payment method, no fees. The zero-cost rule was never relaxed for
this work.

---

## 1. What it is

A native mobile app (Expo SDK 58 / React Native 0.88 / TypeScript) that
**displays bundled information about the Irfan PDF product** on Android and
iPhone:

| Tab | Content |
|---|---|
| Home | Logo, tagline, version/feature stats, and an explicit "what this app is / is not" section |
| Features | All 11 groups / 68 capabilities, grouped with the site's own accent colours |
| Roadmap | Shipped-and-verified vs planned — kept strictly separated, as the site separates them |
| Downloads | The three verified 1.7.0 packages with their SHA-256 values; buttons open the real GitHub-releases URLs in the phone browser |
| About / FAQ | Honest FAQ plus the website, support, security, privacy and terms links |

Content is **bundled from this repository's own `src/data/*.ts` files**
(features, roadmap, downloads, site), so the app reads fully offline, never
scrapes the live site, and never phones home. The product mark and all app
icons are generated from the **same SVG geometry** as `src/components/logo.tsx`
— no artwork was invented.

It runs on a phone through the free **Expo Go** app (Play Store / App Store),
by scanning a QR code from `npx expo start`. No store submission exists or is
planned under the zero-cost rule (Play Store $25 one-time, Apple $99/yr are
both excluded by it).

## 2. What it is not

Stated here and repeated inside the app itself (Home tab and FAQ):

- **Not a mobile version of Irfan PDF.** It does not open, edit, convert,
  OCR or process PDFs in any way.
- **Not published anywhere.** No Play Store, no App Store, no download link
  on the website. Distribution today: none — the source is local (§4).
- **Not a cloud/sync/tracking product.** No account, no analytics, no
  telemetry, no data collection of any kind.
- **Not covered by any security claim.** No 100%-security language appears
  in it; it repeats this project's standing statement that no scan or test
  can guarantee freedom from viruses on any device.

## 3. Verification actually run (2026-10-31, on the local source)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **exit 0** (after fixing two of my own errors: React-19 JSX namespace; RN 0.88 `StatusBar` typing) |
| `npx expo export --platform android --platform ios` | **exit 0** — Android 741 modules, iOS 742 modules bundled |
| `npx expo-doctor` | **20/20 checks passed** (after removing two invalid `app.json` fields the schema rejected: `newArchEnabled`, top-level `splash`) |
| `node scripts/verify-content.mjs` | **exit 0** — 68 feature titles, 16 roadmap titles, 3 SHA-256 hashes all match this repo's `src/data` exactly (zero drift); all 3 download URLs match the live site |
| PII/secret scan of the app source | **0 hits** across 8 tokens |

Honest disclosure: `npm audit` reports **13 vulnerabilities (2 high, 9
moderate, 2 low)** in Expo's build/CLI toolchain (`@expo/cli`, `expo config`,
`glob`, `minimatch`, `zod`). Those run on the development machine only — none
ship inside the bundle a phone executes, and none are in `react-native` or
`react`. They are not zero, and the app's README says so.

The website itself was **not modified** by the app's creation — no site file,
no URL, no SEO artefact, no workflow, no protection setting changed for it.

## 4. Where the source lives

- **Local working copy:** `irfanpdf-mobile/` on the owner's Desktop
  (not inside this repository; the two projects stay separate by design).
- **Remote:** a **private** GitHub repository `irfanpdf/irfanpdf-mobile` was
  created on the owner's account (private = true, verified by API read-back),
  but per the owner's explicit decision of 2026-10-31 the source was
  **kept local and not pushed** (2 unpushed commits at the time of writing).
  Nothing about this repository affects this site's repository — its
  protection, backups and deploy pipeline are untouched either way.
- **Contents:** 32 tracked files — Expo config, the five screens, the bundled
  data modules, the logo component, `scripts/make-icons.mjs` (regenerates the
  PNG icons from the logo SVG) and `scripts/verify-content.mjs` (the drift
  check used in §3), plus a README that states the app's limits in its
  opening section.

## 5. The one wording interaction to be aware of

The website states in two places that no mobile app exists:

- FAQ (`src/app/docs/faq/page.tsx`): *"There is no cloud service, no sync, no
  mobile app and no hosted web version…"*
- Site assistant (`src/lib/assistant.ts`, `id: "mobile"`): *"No mobile, web,
  Mac or Linux version exists."*

**Why they were left unchanged on 2026-10-31:** both sentences appear in
answers to *"Is there a mobile or web version?"* — they assert the absence of
a **mobile version of the product** (something that reads/edits/converts
PDFs), which remains true: the companion app processes no PDFs. It is also
undistributed — no visitor can obtain it, so no visitor can be misled today.

**The honest caveat:** if the companion app is ever distributed (even informally),
those two sentences become misleading as written and must be reworded in the
same change that distributes it — e.g. distinguishing "no mobile version of
Irfan PDF exists" from "a separate free companion information app exists".
Until then this file is the standing reminder; the decision is recorded, not
assumed.

## 6. Rollback / removal

The app has no footprint on the product or the site. To remove it entirely:
delete the local folder (and, if it was ever pushed, delete the private
`irfanpdf-mobile` repository). Nothing on the website, in this repository's
history, or in any deployment references it beyond this document.

---

*No scan or test can guarantee freedom from viruses on any device, including
visitors' machines. This document records what was run, and what was not.*
