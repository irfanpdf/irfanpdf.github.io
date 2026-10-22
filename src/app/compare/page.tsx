import type { Metadata } from "next";
import { canonicalFor } from "@/data/env";
import { PageHero, Note, Badge } from "@/components/ui";
import CompareTable from "@/components/compare-table";
import { ROWS, VERIFIED_ON } from "@/data/comparison";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  ...canonicalFor("/compare"),
  title: "Compare PDF tools",
  description:
    "Irfan PDF vs Adobe Acrobat, Foxit PDF Editor, PDF-XChange Editor and PDF24 Creator — pricing, OCR, editing, conversions, security, AI and deployment, with sources and a verification date.",
};

export default function ComparePage() {
  return (
    <>
      <PageHero
        eyebrow="Compare"
        title="Irfan PDF vs the usual PDF tools"
        lede={`${ROWS.length} fields, five products. Irfan PDF rows come from the shipped code and tests; competitor rows come from the vendors' own pages, fetched and cited.`}
      >
        <Badge tone="green">
          Verification date {VERIFIED_ON}
        </Badge>
        <Badge tone="gray">No claim of superiority without evidence</Badge>
      </PageHero>

      <div className="container-page py-10">
        <div className="mb-6">
          <Note icon="info" title="How this comparison was built">
            “Free / Paid / Limited / Supported / Not Verified” cells each carry a source marker. Click a marker to jump
            to the citation below the table. For Irfan PDF the source is always <strong>[P0]</strong> — the project's
            own code, changelog and the {SITE.gateSuites}-suite regression gate ({SITE.gateResult}, run{" "}
            {SITE.gateRunOn}; the failure that run found first, and the fix it led to, are in the release notes).
          </Note>
        </div>

        <CompareTable />

        <div className="mt-10">
          <Note icon="alert" title="What this table deliberately does not do">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                It never marks a competitor feature “Not Supported” without an explicit statement on their site —
                uncertainty is shown as <em>Not Verified</em>.
              </li>
              <li>
                It never claims IRFAN PDF is “better”. It claims only what the shipped test suite proved for this
                product, and what the vendors published for theirs.
              </li>
              <li>Prices change; re-verify them on the linked pages before quoting them.</li>
            </ul>
          </Note>
        </div>
      </div>
    </>
  );
}
