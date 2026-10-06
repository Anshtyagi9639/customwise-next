"use client";

import { ArrowRight, Mail, Phone, RotateCcw, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { type Ref, useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { type ChatAction, type QuickActionId, type Reply, quickActions } from "./chat-data";

export type Message = { id: number; from: "user"; text: string } | { id: number; from: "bot"; reply: Reply };

type ChatWindowProps = {
  id: string;
  messages: Message[];
  typing: boolean;
  /** The "Live Chat" option in the menu. */
  onStartLive: () => void;
  onQuickAction: (id: QuickActionId, label: string) => void;
  onAction: (action: ChatAction) => void;
  onReset: () => void;
  onClose: () => void;
  ref?: Ref<HTMLDivElement>;
};

const actionIcons = { route: ArrowRight, enquiry: ArrowRight, tel: Phone, mail: Mail } as const;

/** Position, size and frame of the chat panel. Shared with the live-chat panel so both look like one window. */
export const panelClass = cn(
  // Sits above the launcher and below the fixed navbar, so neither is covered.
  "fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 flex w-[calc(100vw-2rem)] max-w-[23.5rem] flex-col overflow-hidden sm:right-6 sm:bottom-[5.75rem]",
  "h-[min(35rem,calc(100svh-var(--nav-h)-6.75rem-env(safe-area-inset-bottom)))] rounded-brand border border-line bg-salt text-overnight shadow-[0_24px_60px_-16px_rgb(0_3_21/0.55)]",
  // The site-wide CARGO focus ring is too faint on white; use ATLANTIC inside the light panel.
  "[&_:focus-visible]:outline-atlantic focus:outline-none",
);

/** Chat panel: brand header, message log and quick actions (including Live Chat). Non-modal, so the page stays usable. */
export function ChatWindow({ id, messages, typing, onStartLive, onQuickAction, onAction, onReset, onClose, ref }: ChatWindowProps) {
  const reduce = useReducedMotion();
  const logRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, typing, reduce]);

  const lastBot = messages.findLastIndex((m) => m.from === "bot");
  const quickActionClass =
    "min-h-9 rounded-full border border-atlantic/45 bg-salt px-3.5 py-1.5 text-[0.86rem] font-semibold text-atlantic transition-colors hover:border-atlantic hover:bg-atlantic hover:text-salt";

  return (
    <motion.div
      ref={ref}
      id={id}
      role="dialog"
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      data-chatbot
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
      style={{ transformOrigin: "bottom right" }}
      className={panelClass}
    >
      <div className="bg-clearance flex items-start gap-3 px-5 pt-4 pb-4 text-salt">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.8rem] tracking-[0.18em] text-cargo uppercase">Customs Wise</p>
          <h2 id={`${id}-title`} className="font-display text-[1.45rem] leading-tight text-salt">
            How can we help?
          </h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          aria-label="Start a new conversation"
          title="Start again"
          className="grid size-10 shrink-0 place-items-center rounded-brand text-starlight transition-colors hover:bg-salt/10 hover:text-salt [&:focus-visible]:outline-cargo"
        >
          <RotateCcw aria-hidden className="size-[18px]" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="-mr-2 grid size-10 shrink-0 place-items-center rounded-brand text-starlight transition-colors hover:bg-salt/10 hover:text-salt [&:focus-visible]:outline-cargo"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-mist px-4 py-4">
        {messages.map((m, i) =>
          m.from === "user" ? (
            <motion.p
              key={m.id}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-auto w-fit max-w-[85%] rounded-brand rounded-br-sm bg-atlantic px-3.5 py-2.5 text-[0.93rem] leading-snug break-words text-salt"
            >
              <span className="sr-only">You: </span>
              {m.text}
            </motion.p>
          ) : (
            <motion.div key={m.id} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%]">
              <div className="rounded-brand rounded-bl-sm border border-line bg-salt px-3.5 py-3 text-[0.93rem] leading-snug text-overnight">
                <span className="sr-only">Customs Wise: </span>
                {m.reply.paragraphs.map((p) => (
                  <p key={p} className="[&+p]:mt-2">
                    {p}
                  </p>
                ))}
                {m.reply.bullets && (
                  <ul className="mt-2 space-y-1 pl-4 text-ink-soft">
                    {m.reply.bullets.map((b) => (
                      <li key={b} className="list-disc marker:text-freight">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {m.reply.actions && m.reply.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.reply.actions.map((a, k) => (
                      <ActionButton key={a.label} action={a} primary={k === 0} onAction={onAction} />
                    ))}
                  </div>
                )}
              </div>
              {/* Main menu under the latest answer */}
              {i === lastBot && !typing && (
                <div role="group" aria-label="Suggested topics" className="mt-3 flex flex-wrap gap-2">
                  {quickActions.map((q) => (
                    <button key={q.id} type="button" onClick={() => onQuickAction(q.id, q.label)} className={quickActionClass}>
                      {q.label}
                    </button>
                  ))}
                  <button type="button" onClick={onStartLive} className={quickActionClass}>
                    Live Chat
                  </button>
                </div>
              )}
            </motion.div>
          ),
        )}
        {typing && (
          <div className="flex w-fit items-center gap-1 rounded-brand rounded-bl-sm border border-line bg-salt px-3.5 py-3.5" role="status">
            <span className="sr-only">Customs Wise is typing</span>
            {[0, 1, 2].map((d) => (
              <span key={d} aria-hidden className="size-1.5 animate-bounce rounded-full bg-breeze motion-reduce:animate-none" style={{ animationDelay: `${d * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
}

function ActionButton({ action, primary, onAction }: { action: ChatAction; primary: boolean; onAction: (a: ChatAction) => void }) {
  const Icon = actionIcons[action.kind];
  const cls = cn(
    "inline-flex min-h-10 items-center gap-1.5 rounded-brand px-3.5 py-2 text-[0.88rem] font-bold transition-colors",
    primary ? "bg-cargo text-overnight hover:bg-haul" : "border border-atlantic text-atlantic hover:bg-atlantic hover:text-salt",
  );
  const body = (
    <>
      {action.kind !== "route" && action.kind !== "enquiry" && <Icon aria-hidden className="size-4" />}
      {action.label}
      {(action.kind === "route" || action.kind === "enquiry") && <Icon aria-hidden className="size-4" />}
    </>
  );
  if (action.kind === "enquiry")
    return (
      <button type="button" className={cls} onClick={() => onAction(action)}>
        {body}
      </button>
    );
  if (action.kind === "route")
    return (
      <Link href={action.href} className={cls} onClick={() => onAction(action)}>
        {body}
      </Link>
    );
  return (
    <a href={action.href} className={cls} onClick={() => onAction(action)}>
      {body}
    </a>
  );
}
