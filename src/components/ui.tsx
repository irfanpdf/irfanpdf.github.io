import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-16 md:py-20 dark:border-zinc-800 dark:from-[#11131c] dark:to-[#0e1016]">
      <div className="container-page max-w-4xl text-center">
        <p className="eyebrow justify-center">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-950 md:text-5xl dark:text-white">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          {lede}
        </p>
        {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function Section({
  title,
  lede,
  children,
  id,
  tone = "light",
}: {
  title?: string;
  lede?: string;
  children: React.ReactNode;
  id?: string;
  /**
   * `dark` is for sections placed inside an always-dark band. Without it the
   * light-mode colours (zinc-950 title, zinc-600 lede) would sit on a dark
   * background — the title ended up the same colour as its background.
   */
  tone?: "light" | "dark";
}) {
  const onDark = tone === "dark";
  return (
    <section id={id} className="py-14 md:py-20">
      <div className="container-page">
        {title && (
          <div className="mx-auto max-w-3xl text-center">
            <h2
              className={`text-3xl font-extrabold tracking-tight md:text-4xl ${
                onDark ? "text-white" : "text-zinc-950 dark:text-white"
              }`}
            >
              {title}
            </h2>
            {lede && (
              <p
                className={`mt-4 text-lg leading-relaxed ${
                  onDark ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {lede}
              </p>
            )}
          </div>
        )}
        <div className={title ? "mt-10" : ""}>{children}</div>
      </div>
    </section>
  );
}

export function Badge({ children, tone = "red" }: { children: React.ReactNode; tone?: "red" | "green" | "gray" | "amber" }) {
  const tones = {
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
    gray: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    amber: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CtaRow({
  primary = { label: "Download for Windows", href: "/download/" },
  secondary = { label: "Explore features", href: "/features/" },
  tertiary = { label: "Read documentation", href: "/docs/" },
}: {
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  tertiary?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link href={primary.href} className="btn btn-primary">
        <Icon name="download" className="h-5 w-5" />
        {primary.label}
      </Link>
      <Link href={secondary.href} className="btn btn-ghost">
        {secondary.label}
      </Link>
      <Link href={tertiary.href} className="text-sm font-semibold text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-300">
        {tertiary.label}
      </Link>
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[0.97rem] leading-relaxed text-zinc-600 dark:text-zinc-300">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  // dt/dd so the hero <dl> stays a valid description list.
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-[#141722]">
      <dt className="text-3xl font-extrabold text-brand dark:text-[#ff6b6b]">{value}</dt>
      <dd className="mt-1 text-sm font-semibold text-zinc-600 dark:text-zinc-400">{label}</dd>
    </div>
  );
}

export function ToolCard({
  title,
  blurb,
  icon,
  color,
}: {
  title: string;
  blurb: string;
  icon: IconName;
  color: string;
}) {
  return (
    <article className="card p-5">
      <span
        className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h3 className="text-[1.02rem] font-bold text-zinc-950 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{blurb}</p>
    </article>
  );
}

export function Note({
  icon = "info",
  title,
  children,
  tone = "amber",
}: {
  icon?: IconName;
  title: string;
  children: React.ReactNode;
  tone?: "amber" | "red" | "blue" | "green";
}) {
  const tones = {
    amber: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
    red: "border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
    blue: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
    green: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100",
  } as const;
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${tones[tone]}`} role="note">
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">{title}</p>
        <div className="mt-1 opacity-90">{children}</div>
      </div>
    </div>
  );
}
