"use client";

import { useMemo, useState } from "react";
import {
  GROUP_LABELS,
  PRODUCTS,
  ROWS,
  SOURCES,
  VERIFIED_ON,
  type Status,
  type ProductKey,
  type Row,
} from "@/data/comparison";
import { Icon } from "@/components/icons";

const STATUS_STYLE: Record<Status, string> = {
  Free: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  Supported: "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  Limited: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  Paid: "bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-600",
  "Not Supported": "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  "Not Verified": "bg-white text-zinc-600 border-zinc-300 dark:bg-[#141722] dark:text-zinc-400 dark:border-zinc-700",
};

function Pill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status]}`}>
      {status}
    </span>
  );
}

function CellView({ cell, srcBase }: { cell: Row["irfan"]; srcBase?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Pill status={cell.status} />
      {cell.note && (
        <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-400">{cell.note}</p>
      )}
      {cell.src && cell.src.length > 0 && (
        <p className="flex flex-wrap gap-1.5">
          {cell.src.map((s) => (
            <a
              key={s}
              href={`#src-${s}`}
              className="text-[11px] font-bold text-brand underline-offset-2 hover:underline dark:text-[#ff6b6b]"
              aria-label={`Source ${s} for this cell`}
            >
              [{s}]
            </a>
          ))}
        </p>
      )}
      {srcBase && null}
    </div>
  );
}

const FILTERS: { key: "all" | Row["group"]; label: string }[] = [
  { key: "all", label: "All rows" },
  ...(
    Object.keys(GROUP_LABELS) as Row["group"][]
  ).map((k) => ({ key: k, label: GROUP_LABELS[k] })),
];

export default function CompareTable() {
  const [filter, setFilter] = useState<"all" | Row["group"]>("all");
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  const rows = useMemo(() => {
    let r = ROWS;
    if (filter !== "all") r = r.filter((row) => row.group === filter);
    if (onlyDifferences) {
      r = r.filter((row) => {
        const statuses = PRODUCTS.map((p) => row[p.key as ProductKey].status);
        return new Set(statuses).size > 1;
      });
    }
    return r;
  }, [filter, onlyDifferences]);

  return (
    <div>
      {/* filters */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter comparison rows">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === f.key
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-[#141722] dark:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto inline-flex cursor-pointer select-none items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-[#141722] dark:text-zinc-300">
          <input
            type="checkbox"
            checked={onlyDifferences}
            onChange={(e) => setOnlyDifferences(e.target.checked)}
            className="h-4 w-4 accent-[#cc0000]"
          />
          Only rows where products differ
        </label>
      </div>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        Showing {rows.length} of {ROWS.length} rows · verification date {VERIFIED_ON}
      </p>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Feature comparison of Irfan PDF against Adobe Acrobat, Foxit PDF Editor, PDF-XChange Editor and PDF24
            Creator. Verification date {VERIFIED_ON}.
          </caption>
          <thead>
            <tr className="bg-zinc-100 dark:bg-[#161926]">
              <th scope="col" className="w-44 px-4 py-3 font-extrabold text-zinc-900 dark:text-zinc-100">
                Field
              </th>
              {PRODUCTS.map((p) => (
                <th
                  key={p.key}
                  scope="col"
                  className={`px-4 py-3 font-extrabold ${
                    p.highlight
                      ? "bg-brand text-white dark:bg-brand"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {p.name}
                  {p.highlight && <span className="ml-2 text-[11px] font-bold opacity-90">THIS PRODUCT</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.field} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                <th scope="row" className="bg-zinc-50 px-4 py-4 font-bold text-zinc-900 dark:bg-[#11131c] dark:text-zinc-100">
                  {row.field}
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                    {GROUP_LABELS[row.group]}
                  </span>
                </th>
                {PRODUCTS.map((p) => (
                  <td
                    key={p.key}
                    className={`px-4 py-4 ${
                      p.highlight ? "bg-red-50/60 dark:bg-red-950/20" : ""
                    }`}
                  >
                    <CellView cell={row[p.key as ProductKey]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No rows match this filter.
        </p>
      )}

      {/* legend + sources */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-950 dark:text-white">Status legend</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(["Free", "Supported", "Limited", "Paid", "Not Supported", "Not Verified"] as Status[]).map((s) => (
              <li key={s}>
                <Pill status={s} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <strong>Not Verified</strong> means we could not confirm the claim on the vendor's own pages at the
            verification date — it is not a claim that the feature is missing.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-950 dark:text-white">
            Sources <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">(fetched {VERIFIED_ON})</span>
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(SOURCES).map(([id, s]) => (
              <li key={id} id={`src-${id}`} className="flex gap-2 text-zinc-600 dark:text-zinc-400">
                <span className="font-bold text-brand dark:text-[#ff6b6b]">[{id}]</span>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="underline underline-offset-2 hover:text-brand dark:hover:text-[#ff6b6b]"
                  >
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                    <Icon name="external" className="ml-1 inline h-3 w-3" />
                  </a>
                ) : (
                  <span>{s.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
