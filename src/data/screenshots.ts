// Screenshot inventory. Every file in public/screenshots/ is a capture taken
// from the real application (clean profile, no user documents) on 2026-10-16 —
// listed here so pages and alt text stay in sync with what actually exists.

export type Shot = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export const SHOTS: Record<string, Shot> = {
  home: {
    src: "/screenshots/home.png",
    alt: "Irfan PDF dashboard with upload area, quick stats and recent files",
    caption: "Dashboard: upload zone, quick stats and recent files.",
    width: 986,
    height: 958,
  },
  files: {
    src: "/screenshots/files.png",
    alt: "Irfan PDF My Documents library with search scopes and type filters",
    caption: "My Documents: name/text search, type filters and file actions.",
    width: 1000,
    height: 958,
  },
  tools: {
    src: "/screenshots/tools.png",
    alt: "Irfan PDF PDF-to-Word tool page showing the Files, Options and Result steps",
    caption: "Every tool follows the same 3-step flow: Files → Options → Result.",
    width: 1000,
    height: 958,
  },
  editor: {
    src: "/screenshots/editor.png",
    alt: "Irfan PDF editor open on a document with the object toolbar and properties panel",
    caption: "Editor: page canvas, object toolbar (text, signatures, shapes) and properties.",
    width: 1000,
    height: 958,
  },
  health: {
    src: "/screenshots/health.png",
    alt: "Irfan PDF health check showing 14 passed, 0 failed after its quick test",
    caption: "Health check after a real Quick test: 14 PASS, 0 FAIL, 2 SKIP (quick mode).",
    width: 986,
    height: 958,
  },
};
