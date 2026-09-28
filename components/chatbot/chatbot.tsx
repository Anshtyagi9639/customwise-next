"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryCta } from "@/lib/site";
import { type ChatAction, type QuickActionId, type Reply, answer, quickReply, welcome } from "./chat-data";
import { ChatbotButton } from "./chatbot-button";
import { type Message, ChatWindow } from "./chat-window";

const PANEL_ID = "cw-chat";
const initialMessages: Message[] = [{ id: 0, from: "bot", reply: welcome }];

/**
 * Customs Wise website assistant. Runs entirely in the browser: answers come from local, pre-written site content
 * (./chat-data.ts), with no external AI service. The conversation is kept while navigating between pages.
 */
export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reduce = useReducedMotion();

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // Escape closes the chat from anywhere on the page.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Move focus into the panel when it opens (not into the text box, which would open the keyboard on phones).
  useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  /** Adds the user's message, then the reply after a short typing indicator. */
  const exchange = (userText: string, reply: Reply, then?: () => void) => {
    clearTimeout(timer.current);
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text: userText }]);
    setTyping(true);
    timer.current = setTimeout(
      () => {
        setTyping(false);
        setMessages((m) => [...m, { id: nextId.current++, from: "bot", reply }]);
        then?.();
      },
      reduce ? 0 : 550,
    );
  };

  /** Scrolls to the enquiry form on this page (home and contact have one), otherwise opens the contact page's form. */
  const goToEnquiry = () => {
    const form = document.getElementById("enquiry") ?? document.getElementById("enquire");
    close(false);
    if (form) {
      // Focus first: focusing during a smooth scroll cancels the scroll in Chrome.
      form.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
      form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    } else {
      router.push(primaryCta.href);
    }
  };

  const onQuickAction = (id: QuickActionId, label: string) => {
    exchange(label, quickReply(id), id === "enquiry" ? () => (timer.current = setTimeout(goToEnquiry, reduce ? 0 : 700)) : undefined);
  };

  const onAction = (action: ChatAction) => {
    if (action.kind === "enquiry") goToEnquiry();
    // Internal links navigate in place; close the panel so the page is visible (the conversation is kept).
    else if (action.kind === "route") close(false);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setTyping(false);
    setMessages(initialMessages);
    panelRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <ChatbotButton ref={buttonRef} open={open} onToggle={() => (open ? close() : setOpen(true))} controls={PANEL_ID} />
      <AnimatePresence>
        {open && (
          <ChatWindow
            ref={panelRef}
            id={PANEL_ID}
            messages={messages}
            typing={typing}
            onQuickAction={onQuickAction}
            onSend={(text) => exchange(text, answer(text))}
            onAction={onAction}
            onReset={reset}
            onClose={() => close()}
          />
        )}
      </AnimatePresence>
    </>
  );
}
