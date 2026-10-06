"use client";

import { ArrowLeft, ArrowRight, Phone, X } from "lucide-react";
import { type Ref, type SyntheticEvent, useRef, useState } from "react";
import { site } from "@/lib/site";
import { withVisitorName } from "@/lib/uwebchat";
import { cn } from "@/lib/utils/cn";
import { panelClass } from "./chat-window";

type LiveChatPanelProps = {
  id: string;
  /** Address of the uWebChat chat window (lib/uwebchat.ts), or null if uWebChat has not been set up. */
  baseUrl: string | null;
  visible: boolean;
  onBack: () => void;
  onClose: () => void;
  /** Opens the site's enquiry form: the fallback offered when live chat cannot be opened. */
  onEnquiry: () => void;
  ref?: Ref<HTMLDivElement>;
};

/** What the visitor entered before the chat, kept for this browser tab only (sessionStorage). */
type LiveChatSession = { name: string; email: string; phone: string; message: string; /** ISO 8601 */ startedAt: string };
type Field = "name" | "email" | "phone" | "message";

const SESSION_KEY = "cw-livechat-session";

function readSession(): LiveChatSession | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const s = value as Record<string, unknown>;
    const ok = (["name", "email", "phone", "message", "startedAt"] as const).every((k) => typeof s[k] === "string" && s[k]);
    return ok && !Number.isNaN(Date.parse(s.startedAt as string)) ? (s as LiveChatSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session: LiveChatSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage blocked: the chat still opens, it just is not remembered after a refresh */
  }
}

/** e.g. "06 Oct 2026, 11:42 AM GMT+1", in the visitor's own time zone. */
function formatStarted(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZoneName: "short" })
    .format(new Date(iso))
    .replace(/\b(am|pm)\b/, (m) => m.toUpperCase());
}

function validate(values: Record<Field, string>): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (values.name.trim().length < 2) errors.name = "Please enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  if (values.phone.replace(/\D/g, "").length < 7) errors.phone = "Please enter your phone number.";
  if (!values.message.trim()) errors.message = "Please tell us how we can help.";
  return errors;
}

/**
 * Live chat with the Customs Wise team, answered from Microsoft Teams through uWebChat.
 * The visitor first fills in a short Customs Wise form; the conversation itself is then uWebChat's own chat window
 * in an iframe (its official embed), which this component only frames. Once opened it stays mounted and is merely
 * hidden, so closing the panel or moving between pages does not end the conversation.
 */
export function LiveChatPanel({ id, baseUrl, visible, onBack, onClose, onEnquiry, ref }: LiveChatPanelProps) {
  // Read once, on the visitor's first click: after a page refresh the form is not shown (or submitted) a second time.
  const [session, setSession] = useState<LiveChatSession | null>(() => (baseUrl ? readSession() : null));
  // The form was completed but there is no uWebChat to open (it has not been configured on this deployment).
  const [unavailable, setUnavailable] = useState(false);
  const headerButton =
    "grid size-10 shrink-0 place-items-center rounded-brand text-starlight transition-colors hover:bg-salt/10 hover:text-salt [&:focus-visible]:outline-cargo";

  const start = (session: LiveChatSession) => {
    if (!baseUrl) {
      // Nothing is stored or sent: the visitor is told plainly, and offered the enquiry form and phone number.
      setUnavailable(true);
      return;
    }
    saveSession(session);
    setSession(session);
  };

  return (
    <div ref={ref} id={id} role="dialog" aria-labelledby={`${id}-title`} tabIndex={-1} data-chatbot hidden={!visible} className={cn(panelClass, !visible && "hidden")}>
      <div className="bg-clearance flex items-start gap-3 px-5 pt-4 pb-4 text-salt">
        <div className="min-w-0 flex-1">
          <p className="font-display text-[0.8rem] tracking-[0.18em] text-cargo uppercase">Customs Wise</p>
          <h2 id={`${id}-title`} className="font-display text-[1.45rem] leading-tight text-salt">
            Live chat
          </h2>
        </div>
        <button type="button" onClick={onBack} aria-label="Back to the assistant" title="Back" className={headerButton}>
          <ArrowLeft aria-hidden className="size-[18px]" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close chat" className={cn(headerButton, "-mr-2")}>
          <X aria-hidden className="size-5" />
        </button>
      </div>

      {session && baseUrl ? (
        <ChatWindowFrame session={session} baseUrl={baseUrl} />
      ) : unavailable ? (
        <Unavailable onEnquiry={onEnquiry} onRetry={() => setUnavailable(false)} />
      ) : (
        <StartForm id={id} onStart={start} onCancel={onBack} />
      )}
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-brand border border-line bg-salt px-3.5 text-base text-overnight placeholder:text-pebble focus-visible:outline-2 focus-visible:outline-offset-0 aria-invalid:border-error";

/** "Start a Live Chat": the visitor's details, checked before uWebChat is opened. */
function StartForm({ id, onStart, onCancel }: { id: string; onStart: (session: LiveChatSession) => void; onCancel: () => void }) {
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  // Guards against a double click arriving before the disabled state has rendered.
  const sent = useRef(false);

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sent.current) return;
    const found = validate(values);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    sent.current = true;
    setSubmitting(true);
    onStart({ name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), message: values.message.trim(), startedAt: new Date().toISOString() });
  };

  const field = (name: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`${id}-${name}`} className="mb-1 block text-[0.86rem] font-semibold text-overnight">
        {label} <span className="text-error">*</span>
      </label>
      <input
        id={`${id}-${name}`}
        value={values[name]}
        onChange={(e) => set(name, e.target.value)}
        aria-required
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        className={inputClass}
        {...props}
      />
      <FieldError id={`${id}-${name}-error`} message={errors[name]} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-mist px-4 py-4">
      <div>
        <h3 className="font-display text-[1.2rem] leading-tight text-atlantic">Start a Live Chat</h3>
        <p className="mt-1 text-[0.86rem] leading-snug text-ink-soft">Tell us a little about you, then chat with the Customs Wise team.</p>
      </div>
      {field("name", "Name", { type: "text", autoComplete: "name", placeholder: "Enter your name", maxLength: 60 })}
      {field("email", "Email", { type: "email", autoComplete: "email", inputMode: "email", placeholder: "Enter your email address", maxLength: 120 })}
      {field("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "Enter your phone number", maxLength: 30 })}
      <div>
        <label htmlFor={`${id}-message`} className="mb-1 block text-[0.86rem] font-semibold text-overnight">
          How can we help? <span className="text-error">*</span>
        </label>
        <textarea
          id={`${id}-message`}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="How can we help you?"
          aria-required
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? `${id}-message-error` : undefined}
          className={cn(inputClass, "resize-none py-2.5 leading-snug")}
        />
        <FieldError id={`${id}-message-error`} message={errors.message} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-brand border border-atlantic px-4 text-[0.95rem] font-bold text-atlantic transition-colors hover:bg-atlantic hover:text-salt"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 flex-1 rounded-brand bg-cargo px-4 text-[0.95rem] font-bold text-overnight transition-colors hover:bg-haul disabled:opacity-60"
        >
          {submitting ? "Connecting…" : "Start Live Chat"}
        </button>
      </div>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="mt-1 text-[0.8rem] font-semibold text-error">
      {message}
    </p>
  ) : null;
}

/** Shown instead of a chat when uWebChat has not been set up. Deliberately plain: nothing was sent to anyone. */
function Unavailable({ onEnquiry, onRetry }: { onEnquiry: () => void; onRetry: () => void }) {
  const button = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-brand px-4 text-[0.95rem] font-bold transition-colors";
  return (
    <div role="alert" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-mist px-4 py-5">
      <h3 className="font-display text-[1.2rem] leading-tight text-atlantic">We couldn&apos;t connect you</h3>
      <p className="text-[0.93rem] leading-snug text-ink-soft">
        Live chat can&apos;t be opened right now, so your details have not been sent to our team. Please send us an enquiry or call us and we&apos;ll help.
      </p>
      <div className="flex flex-col gap-2 pt-1">
        <button type="button" onClick={onEnquiry} className={cn(button, "bg-cargo text-overnight hover:bg-haul")}>
          Open the enquiry form <ArrowRight aria-hidden className="size-4" />
        </button>
        <a href={site.phone.href} className={cn(button, "border border-atlantic text-atlantic hover:bg-atlantic hover:text-salt")}>
          <Phone aria-hidden className="size-4" /> Call {site.phone.display}
        </a>
        <button type="button" onClick={onRetry} className="min-h-10 text-[0.88rem] font-bold text-atlantic underline underline-offset-3 hover:text-freight">
          Back to the form
        </button>
      </div>
    </div>
  );
}

/**
 * uWebChat's chat window. It is a page on uWebChat's servers, so this site cannot see inside it: no "connected"
 * state is shown here, because only uWebChat knows when a team member has joined.
 */
function ChatWindowFrame({ session, baseUrl }: { session: LiveChatSession; baseUrl: string }) {
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(session.message);
      setCopied(true);
    } catch {
      /* clipboard blocked: the message is shown above to retype */
    }
  };

  return (
    <>
      <div className="border-b border-line bg-mist px-4 py-2 text-[0.78rem] leading-snug text-ink-soft">
        <p>
          <span className="font-semibold text-overnight">Started:</span> <time dateTime={session.startedAt}>{formatStarted(session.startedAt)}</time>
        </p>
        <p className="mt-0.5">
          Press <span className="font-semibold text-overnight">Start chat!</span> below, then send your message.{" "}
          <button type="button" onClick={copy} className="font-bold text-atlantic underline underline-offset-3 hover:text-freight">
            {copied ? "Copied" : "Copy my message"}
          </button>
        </p>
      </div>
      <div className="relative min-h-0 flex-1 bg-salt">
        {!loaded && (
          <p role="status" className="absolute inset-0 grid place-items-center px-6 text-center text-[0.93rem] text-ink-soft">
            Connecting…
          </p>
        )}
        <iframe
          src={withVisitorName(baseUrl, session.name)}
          title="Live chat with the Customs Wise team"
          // As in uWebChat's embed code: lets the visitor use the chat window's voice input if they choose to.
          allow="microphone"
          onLoad={() => setLoaded(true)}
          className="relative size-full border-0"
        />
      </div>
    </>
  );
}
