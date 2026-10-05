"use client";

import { ArrowLeft, X } from "lucide-react";
import { type Ref, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { panelClass } from "./chat-window";

type LiveChatPanelProps = {
  id: string;
  /** Address of the uWebChat chat window (lib/uwebchat.ts). */
  src: string;
  visible: boolean;
  onBack: () => void;
  onClose: () => void;
  ref?: Ref<HTMLDivElement>;
};

/**
 * Live chat with the Customs Wise team, answered from Microsoft Teams through uWebChat.
 * The conversation itself is uWebChat's own chat window in an iframe (its official embed); this component only
 * supplies the Customs Wise frame around it. Once opened it stays mounted and is merely hidden, so closing the panel
 * or moving between pages does not end the conversation.
 */
export function LiveChatPanel({ id, src, visible, onBack, onClose, ref }: LiveChatPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const headerButton =
    "grid size-10 shrink-0 place-items-center rounded-brand text-starlight transition-colors hover:bg-salt/10 hover:text-salt [&:focus-visible]:outline-cargo";

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

      <div className="relative min-h-0 flex-1 bg-salt">
        {!loaded && (
          <p role="status" className="absolute inset-0 grid place-items-center px-6 text-center text-[0.93rem] text-ink-soft">
            Connecting you to our team…
          </p>
        )}
        <iframe
          src={src}
          title="Live chat with the Customs Wise team"
          // As in uWebChat's embed code: lets the visitor use the chat window's voice input if they choose to.
          allow="microphone"
          onLoad={() => setLoaded(true)}
          className="relative size-full border-0"
        />
      </div>
    </div>
  );
}
