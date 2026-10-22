// Original inline SVG icon set (no icon library, no CDN — the site must work
// fully offline and load fast). Stroke style, inherits currentColor.

export type IconName =
  | "eye"
  | "zoom"
  | "pages"
  | "windows"
  | "pen"
  | "type"
  | "signature"
  | "shapes"
  | "undo"
  | "grid"
  | "scan"
  | "textCursor"
  | "rotate"
  | "image"
  | "offline"
  | "fileWord"
  | "filePdf"
  | "files"
  | "fileSpreadsheet"
  | "text"
  | "merge"
  | "split"
  | "reorder"
  | "crop"
  | "broom"
  | "stamp"
  | "wrench"
  | "compress"
  | "target"
  | "sparkles"
  | "lock"
  | "key"
  | "redact"
  | "badge"
  | "search"
  | "compare"
  | "layers"
  | "report"
  | "stop"
  | "printer"
  | "spark"
  | "users"
  | "heart"
  | "palette"
  | "check"
  | "download"
  | "arrowRight"
  | "external"
  | "info"
  | "alert"
  | "shield"
  | "cpu"
  | "globe"
  | "terminal";

const P: Record<IconName, string> = {
  eye: "M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  zoom: "M4 13a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z M8.5 13h9 M13 9.5v9 M20.5 20.5 16 16",
  pages: "M7 3h7l4 4v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z M14 3v4h4 M8 12h7 M8 16h7",
  windows: "M3 5.5 10.5 4.4v6.6H3V5.5Z M12.5 4.1 21 3v8h-8.5V4.1Z M3 13h7.5v6.6L3 18.5V13Z M12.5 13H21v8l-8.5-1.1V13Z",
  pen: "m4 20 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1Z M14.5 6.5l3 3",
  type: "M4 6V4.5h16V6 M12 4.5V20 M9 20h6",
  signature: "M3 17c2.5 0 3-9 5-9s1.5 7 3.5 7 2-4 3.5-4 1.5 4 3.5 4 M3 20.5h18",
  shapes: "M4 4h7v7H4V4Z M13.5 13.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z M7.5 14 4 20.5h7L7.5 14Z",
  undo: "M8 6 4 10l4 4 M4 10h9a6 6 0 0 1 0 12h-3",
  grid: "M4 4h16v16H4V4Z M4 9.33h16 M4 14.67h16 M9.33 4v16 M14.67 4v16",
  scan: "M4 8V6a2 2 0 0 1 2-2h2 M16 4h2a2 2 0 0 1 2 2v2 M20 16v2a2 2 0 0 1-2 2h-2 M8 20H6a2 2 0 0 1-2-2v-2 M7 12h10",
  textCursor: "M9 4h6 M12 4v16 M9 20h6 M5 8v8 M19 8v8",
  rotate: "M4 9a8 8 0 1 1 1.8 7 M4 4v5h5",
  image: "M4 5h16v14H4V5Z M4 16l4.5-4.5 3.5 3.5 3-3L20 16 M15 9.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z",
  offline: "M12 3v7 M7.5 6.5a7.5 7.5 0 1 0 9 0 M12 13.5v4.5 M9.5 21h5",
  fileWord: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 12l1.5 6 1.5-4 1.5 4L15 12",
  filePdf: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M9 17v-5h1.6a1.7 1.7 0 0 1 0 3.4H9 M14 17v-5h1.3c1 0 1.7 1.1 1.7 2.5S16.3 17 15.3 17H14",
  files: "M8 3h7l4 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M15 3v4h4 M4 7v13a2 2 0 0 0 2 2h9",
  fileSpreadsheet: "M6 3h8l4 4v14H6V3Z M14 3v4h4 M8.5 12h7v5.5h-7V12Z M8.5 14.75h7 M12 12v5.5",
  text: "M5 5h14 M5 9.5h14 M5 14h9 M5 18.5h6",
  merge: "M6 4v4a5 5 0 0 0 5 5h6 M6 20v-4a5 5 0 0 1 5-5 M15 10l3 3-3 3",
  split: "M12 4v5 M12 15v5 M6 12h4 M14 12h4 M9 9l3 3-3 3 M18 9l-3 3 3 3",
  reorder: "M4 7h9 M4 12h13 M4 17h7 M18 4v12 M15.5 13.5 18 16l2.5-2.5",
  crop: "M7 3v14h14 M3 7h14v14",
  broom: "M14 4l6 6 M13 7 5.5 14.5a2 2 0 0 0 0 2.8l1.2 1.2a2 2 0 0 0 2.8 0L17 11 M8 17l-3 3",
  stamp: "M12 3a3 3 0 0 0-3 3c0 2 .5 3 1.5 4H13.5C15.5 9 16 8 16 6a3 3 0 0 0-3-3h-1Z M5 15h14v3H5v-3Z M4 20.5h16",
  wrench: "M14.5 4a5 5 0 0 0-5.7 6.6L4 15.4 8.6 20l4.8-4.8A5 5 0 0 0 20 9.5l-3 1.5-2.5-2.5 1.5-3A5 5 0 0 0 14.5 4Z",
  compress: "M12 3v6 M12 15v6 M8 7l4-4 4 4 M8 17l4 4 4-4 M4 12h4 M16 12h4",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  sparkles: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z M19 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9L19 15Z M5 16l.7 1.8 1.8.7-1.8.7L5 21l-.7-1.8-1.8-.7 1.8-.7L5 16Z",
  lock: "M6 11h12v9H6v-9Z M8.5 11V8a3.5 3.5 0 0 1 7 0v3 M12 14.5v2.5",
  key: "M15 4a5 5 0 1 1-4.6 7L4 17.4V20h2.6l.9-.9v-1.7h1.7l.9-.9v-1.7h1.7l1-1A5 5 0 0 1 15 4Z M16.5 8h.01",
  redact: "M4 6h16v4H4V6Z M4 14h10v4H4v-4Z M17 14h3v4h-3v-4Z",
  badge: "M12 3l7 3v5.5c0 4.3-3 7.8-7 9.5-4-1.7-7-5.2-7-9.5V6l7-3Z M9 12l2.2 2.2L15.5 10",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M16.2 16.2 21 21",
  compare: "M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10 M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14 M12 3v18 M8 9l-2 3 2 3 M16 9l2 3-2 3",
  layers: "m12 3 8 4.5-8 4.5-8-4.5L12 3Z M4 12.5l8 4.5 8-4.5 M4 16.5l8 4.5 8-4.5",
  report: "M6 3h9l3 3v15H6V3Z M15 3v3h3 M9 17v-4 M12 17v-7 M15 17v-2",
  stop: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9 9h6v6H9V9Z",
  printer: "M7 8V3.5h10V8 M6 8h12a2 2 0 0 1 2 2v6h-4v4H8v-4H4v-6a2 2 0 0 1 2-2Z M8 16h8v4.5H8V16Z",
  spark: "M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z M18.5 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20 M16 4.5a3.5 3.5 0 0 1 0 6.8 M18 14.2a4.5 4.5 0 0 1 3 4.3V20",
  heart: "M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z",
  palette: "M12 21a9 9 0 1 1 0-18c5 0 9 3.2 9 7 0 2.5-2 4-4.5 4H15a1.8 1.8 0 0 0-1.3 3c.5.8 0 2-1.2 2-1 0-1.8-.5-2.5-.5-1.4 0-2.5 1-2.5 2.5Z M7.5 10h.01 M10.5 6.8h.01 M15 7h.01 M17 10.5h.01",
  check: "m4.5 12.5 5 5 10-11",
  download: "M12 4v10 M7.5 9.5 12 14l4.5-4.5 M4.5 19.5h15",
  arrowRight: "M4 12h15 M13.5 6.5 20 12l-6.5 5.5",
  external: "M14 4h6v6 M20 4l-8.5 8.5 M18 14v5.5A1.5 1.5 0 0 1 16.5 21h-11A1.5 1.5 0 0 1 4 19.5v-11A1.5 1.5 0 0 1 5.5 7H11",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5.5 M12 7.6h.01",
  alert: "M12 4 2.8 20h18.4L12 4Z M12 10v4.5 M12 17.4h.01",
  shield: "M12 3l7 3v5.5c0 4.3-3 7.8-7 9.5-4-1.7-7-5.2-7-9.5V6l7-3Z",
  cpu: "M8 8h8v8H8V8Z M5 5h14v14H5V5Z M9.5 2v3 M14.5 2v3 M9.5 19v3 M14.5 19v3 M2 9.5h3 M2 14.5h3 M19 9.5h3 M19 14.5h3",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M3.2 9.5h17.6 M3.2 14.5h17.6 M12 3c-5 5.2-5 12.8 0 18 M12 3c5 5.2 5 12.8 0 18",
  terminal: "M4 5h16v14H4V5Z M7.5 9.5l3 2.5-3 2.5 M12.5 15h4",
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={P[name]} />
    </svg>
  );
}

/** Colorful icon chip used on feature/tool cards. */
export function IconChip({
  name,
  color,
  size = "md",
}: {
  name: IconName;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "h-9 w-9 rounded-lg" : size === "lg" ? "h-14 w-14 rounded-2xl" : "h-11 w-11 rounded-xl";
  return (
    <span
      className={`inline-flex ${dim} items-center justify-center text-white shadow-sm`}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      <Icon name={name} className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} />
    </span>
  );
}
