"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-line first:border-t", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header asChild>
      <h3 className="font-sans text-overnight">
        <AccordionPrimitive.Trigger
          className={cn(
            "group flex w-full items-start justify-between gap-5 py-5 text-left text-[1.05rem] font-semibold leading-snug transition-colors hover:text-atlantic",
            className,
          )}
          {...props}
        >
          {children}
          <Plus aria-hidden className="mt-0.5 size-5 shrink-0 text-freight transition-transform duration-200 group-data-[state=open]:rotate-45" />
        </AccordionPrimitive.Trigger>
      </h3>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="overflow-hidden" {...props}>
      <div className={cn("max-w-[70ch] pb-5 text-ink-soft", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
