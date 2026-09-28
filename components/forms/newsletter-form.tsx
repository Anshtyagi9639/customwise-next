"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/lib/enquiry/newsletter-action";
import { newsletterSchema, type NewsletterInput } from "@/lib/validation/newsletter";

type Status = { kind: "idle" } | { kind: "success" } | { kind: "error" | "unavailable"; message: string };

export function NewsletterForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema), mode: "onSubmit", defaultValues: { email: "", company_site: "" } });

  const onSubmit = async (values: NewsletterInput) => {
    setStatus({ kind: "idle" });
    const result = await subscribeToNewsletter(values);
    if (result.ok) {
      reset();
      setStatus({ kind: "success" });
    } else {
      setStatus({ kind: result.notConfigured ? "unavailable" : "error", message: result.message });
    }
  };

  const emailId = `${id}-email`;
  const errorId = `${id}-error`;

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor={emailId} className="sr-only">
            Email address
          </label>
          <input
            id={emailId}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter your email address"
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? errorId : undefined}
            className="block min-h-12 w-full rounded-brand border-2 border-salt/25 bg-salt px-4 text-base text-overnight placeholder:text-pebble focus:border-cargo focus:outline-none aria-[invalid=true]:border-[#ffb4ab]"
            {...register("email")}
          />
          {errors.email?.message && (
            <p id={errorId} className="mt-2 text-[0.88rem] font-semibold text-[#ffd5cf]">
              {errors.email.message}
            </p>
          )}
        </div>
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${id}-hp`}>Leave empty</label>
          <input id={`${id}-hp`} tabIndex={-1} autoComplete="off" {...register("company_site")} />
        </div>
        <Button type="submit" disabled={isSubmitting} className="shrink-0">
          {isSubmitting ? (
            <>
              <Loader2 aria-hidden className="animate-spin" /> Subscribing
            </>
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
      <div aria-live="polite" className="mt-3 min-h-6 text-[0.92rem]">
        {status.kind === "success" && (
          <p className="flex items-start gap-2 font-semibold text-salt">
            <CheckCircle2 aria-hidden className="mt-0.5 size-4.5 shrink-0 text-transit" /> Thanks, you&apos;re subscribed to Customs Wise updates.
          </p>
        )}
        {status.kind === "unavailable" && (
          <p className="flex items-start gap-2 text-starlight">
            <Info aria-hidden className="mt-0.5 size-4.5 shrink-0 text-cargo" /> {status.message}
          </p>
        )}
        {status.kind === "error" && <p role="alert" className="font-semibold text-[#ffd5cf]">{status.message}</p>}
      </div>
    </div>
  );
}
