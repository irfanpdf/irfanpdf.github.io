"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import {
  DISCLAIMER,
  FALLBACK,
  INTRO,
  SUGGESTIONS,
  answerFor,
  type AssistantLink,
} from "@/lib/assistant";

/**
 * Floating site assistant. Purely client-side: it matches the visitor's
 * question against src/lib/assistant.ts (grounded in the site's own data)
 * and renders the reply — no API, no network, no key. The panel only mounts
 * when opened, so the server-rendered HTML stays just the toggle button.
 */

type Msg = { from: "bot" | "user"; text: string; link?: AssistantLink };

const INITIAL_MESSAGES: Msg[] = [{ from: "bot", text: INTRO.text, link: INTRO.link }];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const toggleRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  // Escape closes; focus moves into the panel on open (and back on close).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the newest message visible.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const a = answerFor(q);
    setMessages((prev) => [...prev, { from: "user", text: q }, { from: "bot", text: a.reply, link: a.link }]);
    setDraft("");
    inputRef.current?.focus();
  };

  const last = messages[messages.length - 1];
  const showChips =
    messages.length === 1 || (last.from === "bot" && last.text === FALLBACK.text);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls="site-assistant-panel"
        aria-label={open ? "Close site assistant" : "Open site assistant"}
        title={open ? "Close site assistant" : "Ask the site assistant"}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-dark active:scale-95"
      >
        <Icon name={open ? "x" : "chat"} className="h-6 w-6" strokeWidth={2} />
      </button>

      {open && (
        <div
          id="site-assistant-panel"
          role="dialog"
          aria-label="Irfan PDF site assistant"
          className="fixed bottom-24 right-5 left-5 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:left-auto sm:w-96 dark:border-zinc-700 dark:bg-[#141722]"
        >
          {/* header */}
          <div className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Icon name="sparkles" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight">Irfan PDF Assistant</p>
              <p className="text-xs leading-tight opacity-90">Answers from this site&apos;s documentation</p>
            </div>
          </div>

          {/* messages */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.from === "user"
                      ? "bg-red-50 text-zinc-900 dark:bg-red-950/50 dark:text-red-50"
                      : "bg-zinc-100 text-zinc-800 dark:bg-[#1c1f2b] dark:text-zinc-200"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.link && (
                    <Link
                      href={m.link.href}
                      onClick={close}
                      className="mt-2 inline-flex items-center gap-1 font-bold text-brand underline-offset-4 hover:underline dark:text-[#ff6b6b]"
                    >
                      {m.link.label}
                      <Icon name="arrowRight" className="h-4 w-4" strokeWidth={2.2} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* starter questions */}
          {showChips && (
            <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-4 pt-3 dark:border-zinc-800">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:bg-[#141722] dark:text-zinc-300 dark:hover:border-[#ff6b6b] dark:hover:text-[#ff6b6b]"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className={`flex items-center gap-2 px-4 ${showChips ? "pb-3 pt-3" : "border-t border-zinc-100 py-3 dark:border-zinc-800"}`}
          >
            <label htmlFor="site-assistant-input" className="sr-only">
              Ask a question about Irfan PDF
            </label>
            <input
              id="site-assistant-input"
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
              placeholder="Ask about Irfan PDF…"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-[#101320] dark:text-white"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send question"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="arrowRight" className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </form>

          <p className="border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-[11px] leading-snug text-zinc-500 dark:border-zinc-800 dark:bg-[#101320] dark:text-zinc-400">
            {DISCLAIMER}
          </p>
        </div>
      )}
    </>
  );
}
