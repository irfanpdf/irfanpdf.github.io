// Site-wide constants. Every value here comes from the project inspection
// (see docs/VERIFICATION-REPORT.md). Do not invent values.

export const SITE = {
  name: "Irfan PDF",
  tagline: "Your Documents. Your Control.",
  subtitle:
    "View, organize, convert, search, and work with PDF documents using a practical Windows desktop application.",
  version: "1.7.0",
  /** CHANGELOG.md: "## 1.7.0 final build - 2026-10-11" */
  releaseDate: "2026-10-11",
  /** dist\ artifacts were rebuilt 2026-10-22 and verified by running them */
  packageDate: "2026-10-22",
  /** Full regression gate executed for this site's verification pass. */
  verifiedOn: "2026-10-16",
  /** Date of the most recent full gate run (py -3.12 tests/run_regression.py). */
  gateRunOn: "2026-10-17",
  gateSuites: 43,
  gateSuitesPassed: 43,
  gateResult: "43 / 43 suites PASS",
  /**
   * How that number was reached, because a bare "PASS" is not the whole story:
   * the 2026-10-17 gate initially failed `test_batch_compare` (43/46 checks) —
   * a stop request on a single-document OCR was acknowledged but not honoured.
   * The cause was fixed in the source (stop is now polled between OCR pages, and
   * the Analyst's stop was passing a property where a callable was expected) and
   * the suite's 4-page fixture was replaced with a 12-page one so the scenario is
   * actually exercised. Re-run the same day: 43/43, 0 failures.
   */
  gateNote:
    "The first run of this gate on 2026-10-17 failed one suite (43/46 checks) because Stop did not reach a running OCR job; the source was fixed the same day, the fixture made honest, and the re-run passed 43/43 with 0 failures. The 1.7.0 packages on the Download Center were rebuilt after that fix (2026-10-22) and carry it.",
  /** TEST-REPORT.md, generated 2026-10-05 */
  shippedReportSuites: 40,
  shippedReportChecks: 1093,
  os: "Windows 10 (1809 or newer) or Windows 11, 64-bit",
  publisher: "Irfan PDF",
} as const;

export type NavItem = { label: string; href: string };

export const MAIN_NAV: NavItem[] = [
  { label: "Features", href: "/features/" },
  { label: "How it works", href: "/how-it-works/" },
  { label: "Use cases", href: "/use-cases/" },
  { label: "Compare", href: "/compare/" },
  { label: "Security", href: "/security/" },
  { label: "Docs", href: "/docs/" },
];

export const DOCS_NAV: NavItem[] = [
  { label: "Documentation home", href: "/docs/" },
  { label: "Installation", href: "/docs/installation/" },
  { label: "OCR guide", href: "/docs/ocr-guide/" },
  { label: "Conversion guide", href: "/docs/conversion-guide/" },
  { label: "Troubleshooting", href: "/docs/troubleshooting/" },
  { label: "FAQ", href: "/docs/faq/" },
  { label: "Release notes", href: "/docs/release-notes/" },
  { label: "Contact & support", href: "/docs/contact/" },
  { label: "Privacy policy", href: "/docs/privacy/" },
  { label: "Terms of use", href: "/docs/terms/" },
];
