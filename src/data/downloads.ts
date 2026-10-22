// Download Center data. Values measured directly from the artifacts in
// docuforge\dist on 2026-10-22 (Get-FileHash SHA256, Get-AuthenticodeSignature);
// each artifact was also verified by extracting/installing it and running the
// application's own self-test, and the Stop fix was exercised on the installed
// copy and on the extracted Professional package. A URL is only ever produced
// from NEXT_PUBLIC_DOWNLOAD_BASE_URL - never invented.

export type Artifact = {
  id: string;
  filename: string;
  kind: "installer" | "portable";
  label: string;
  version: string;
  bytes: number;
  mib: string;
  sha256: string;
  built: string;
  installerType: string;
  windows: string;
  signature: string;
  selfContained: boolean;
  recommended: boolean;
  verified: boolean;
  note?: string;
};

export const DOWNLOAD_BASE_URL: string | null =
  process.env.NEXT_PUBLIC_DOWNLOAD_BASE_URL?.replace(/\/+$/, "") || null;

export function artifactUrl(a: Artifact): string | null {
  return DOWNLOAD_BASE_URL ? `${DOWNLOAD_BASE_URL}/${a.filename}` : null;
}

export const ARTIFACTS: Artifact[] = [
  {
    id: "setup",
    filename: "IrfanPDF_Setup_1.7.0.exe",
    kind: "installer",
    label: "Windows installer",
    version: "1.7.0",
    bytes: 115995494,
    mib: "110.6 MiB",
    sha256:
      "C57968BA6397622A01BE912504D8D2CEABBACCA4F1074ED767C87EDD46D0A7C5",
    built: "2026-10-22",
    installerType:
      "Inno Setup 6 executable · per-user install (no administrator rights required)",
    windows: "Windows 10 (1809 or newer) or Windows 11, 64-bit",
    signature: "Not signed (Authenticode: NotSigned)",
    selfContained: true,
    recommended: true,
    verified: true,
    note:
      "Bundles its own Python runtime — nothing else to install. Adds Desktop/Start Menu shortcuts, .pdf association and an uninstall entry. Verified 2026-10-22: silent install to a clean folder, self-test PASS 20 / FAIL 0, a Stop on a 12-page scan ended the job cancelled with no output file, and the uninstall left no installed files behind.",
  },
  {
    id: "professional",
    filename: "IRFAN-PDF-PROFESSIONAL.zip",
    kind: "portable",
    label: "Portable package (self-contained)",
    version: "1.7.0",
    bytes: 155787006,
    mib: "148.6 MiB",
    sha256:
      "02B95E2487EBB441EF841D5AE671E97C3AE9AF0D2176CE835B4906E99897F4D9",
    built: "2026-10-22",
    installerType:
      "ZIP archive · extract and run START-APPLICATION\\START-APPLICATION.bat",
    windows: "Windows 10 (1809 or newer) or Windows 11, 64-bit",
    signature: "n/a (ZIP archives are not Authenticode-signed)",
    selfContained: true,
    recommended: false,
    verified: true,
    note:
      "4,452 files (365.6 MiB extracted) including Application\\runtime (4,195 files) and the full test suite — runs on a PC that has never had Python installed. Verified 2026-10-22 from the extracted package: self-test PASS 20 / FAIL 0 with its own bundled runtime, and a Stop on a 12-page scan ended the job cancelled with no output file.",
  },
  {
    id: "portable-source",
    filename: "IrfanPDF_Portable.zip",
    kind: "portable",
    label: "Source package (needs Python)",
    version: "1.7.0",
    bytes: 7705955,
    mib: "7.3 MiB",
    sha256:
      "72EAA80178D867372872658F5AFCFC38BC40101B60BD62D0BFC936788BA8FD98",
    built: "2026-10-22",
    installerType: "ZIP archive · application sources only (no bundled runtime)",
    windows: "Windows 10/11, 64-bit, with Python 3.10 or newer and requirements.txt",
    signature: "n/a (ZIP archives are not Authenticode-signed)",
    selfContained: false,
    recommended: false,
    verified: true,
    note:
      "The application sources: 78 files, no bundled Python, so it needs the PC's own Python 3.10+ and one `pip install -r requirements.txt` (the README inside says exactly that, and the launcher sits in the folder root). Verified 2026-10-22 from the extracted package: self-test PASS 20 / FAIL 0. Pick this only if you already have Python; otherwise use the installer or the Professional package.",
  },
];

export const WINDOWS_REQ = "Windows 10 (1809 or newer) or Windows 11, 64-bit";
