"use client";

import { useState } from "react";
import { ARTIFACTS, artifactUrl, DOWNLOAD_BASE_URL, type Artifact } from "@/data/downloads";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui";

function ShaRow({ sha }: { sha: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sha);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // Clipboard blocked (permission or insecure context): say so instead of
      // failing silently — the checksum stays selectable in the code block.
      setState("failed");
      setTimeout(() => setState("idle"), 4000);
    }
  };
  return (
    <div className="mt-3">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">SHA-256</p>
      <div className="mt-1 flex items-start gap-2">
        <code className="block flex-1 break-all rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[11px] leading-relaxed text-zinc-700 select-all dark:border-zinc-700 dark:bg-[#161926] dark:text-zinc-300">
          {sha}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={
            state === "copied"
              ? "Checksum copied to clipboard"
              : state === "failed"
                ? "Copy failed — select the checksum text and copy it manually"
                : "Copy SHA-256 checksum to clipboard"
          }
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-[#141722] dark:text-zinc-300 dark:hover:bg-[#1c1f2b]"
        >
          {state === "copied" ? (
            <Icon name="check" className="h-4 w-4 text-emerald-600" strokeWidth={2.6} />
          ) : state === "failed" ? (
            <Icon name="alert" className="h-4 w-4 text-amber-600" strokeWidth={2.2} />
          ) : (
            <Icon name="report" className="h-4 w-4" />
          )}
        </button>
      </div>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Checksum copied" : state === "failed" ? "Copy failed — select the checksum text and copy it manually" : ""}
      </span>
    </div>
  );
}

function DownloadButton({ a }: { a: Artifact }) {
  const url = artifactUrl(a);
  if (!a.verified) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        <Icon name="alert" className="h-4 w-4 shrink-0" />
        Not offered for download — see the note above
      </p>
    );
  }
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-[#161926]">
        <p className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
          <Icon name="info" className="h-4 w-4 shrink-0 text-zinc-400" />
          Download link not configured yet
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          The package exists and its checksum is published above, but this site has no hosting URL for it — and this
          site never links to a guessed address. To enable this button, set{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_DOWNLOAD_BASE_URL</code> at build
          time to the directory where the file will be served from (see README → Deployment), then rebuild.
        </p>
      </div>
    );
  }
  return (
    <a
      href={url}
      download
      className={`btn w-full ${a.recommended ? "btn-brand" : "btn-primary"}`}
      aria-label={`Download ${a.filename}, ${a.label}, version ${a.version}`}
    >
      <Icon name="download" className="h-5 w-5" />
      {a.recommended ? "Download Installer" : "Download package"}
    </a>
  );
}

export default function DownloadCards() {
  const configured = Boolean(DOWNLOAD_BASE_URL);
  return (
    <div className="space-y-6">
      {!configured && (
        <div className="rounded-2xl border border-sky-300 bg-sky-50 p-5 dark:border-sky-800 dark:bg-sky-950/40" role="note">
          <p className="flex items-center gap-2 font-bold text-sky-950 dark:text-sky-200">
            <Icon name="info" className="h-5 w-5 shrink-0" /> Exact missing requirement
          </p>
          <p className="mt-2 text-sm leading-relaxed text-sky-900/90 dark:text-sky-200/90">
            A public hosting location for the release files. Nothing on this page invents a download URL: the three
            packages below are verified (name, version, size, SHA-256, signature status) and will become one-click
            downloads the moment{" "}
            <code className="rounded bg-sky-200/70 px-1 dark:bg-sky-900/70">NEXT_PUBLIC_DOWNLOAD_BASE_URL</code> points
            to their served location.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {ARTIFACTS.map((a) => (
          <article
            key={a.id}
            className={`card flex flex-col p-6 ${a.recommended ? "ring-2 ring-brand" : ""} ${
              !a.verified ? "opacity-95" : ""
            }`}
            aria-labelledby={`pkg-${a.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl text-white ${
                  a.kind === "installer" ? "bg-brand" : "bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900"
                }`}
                aria-hidden="true"
              >
                <Icon name={a.kind === "installer" ? "download" : "files"} className="h-5 w-5" />
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
                {a.recommended && <Badge tone="red">Recommended</Badge>}
                {a.verified ? (
                  <Badge tone="green">Verified</Badge>
                ) : (
                  <Badge tone="amber">Not Verified</Badge>
                )}
              </div>
            </div>

            <h2 id={`pkg-${a.id}`} className="mt-4 text-lg font-extrabold text-zinc-950 dark:text-white">
              {a.label}
            </h2>
            <p className="mt-0.5 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">{a.filename}</p>

            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Version", a.version],
                ["Release date", `2026-10-11 (packages rebuilt ${a.built})`],
                ["File size", `${a.bytes.toLocaleString("en-US")} bytes (${a.mib})`],
                ["Type", a.installerType],
                ["Windows", a.windows],
                ["Digital signature", a.signature],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-zinc-600 dark:text-zinc-400">{k}</dt>
                  <dd className="flex-1 font-semibold text-zinc-800 dark:text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>

            <ShaRow sha={a.sha256} />

            {a.note && (
              <p className={`mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed ${
                a.verified
                  ? "bg-zinc-100 text-zinc-600 dark:bg-[#161926] dark:text-zinc-400"
                  : "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
              }`}>
                {a.note}
              </p>
            )}

            <div className="mt-auto pt-5">
              <DownloadButton a={a} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
