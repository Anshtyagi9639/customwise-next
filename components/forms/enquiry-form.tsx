"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { submitEnquiry } from "@/lib/enquiry/actions";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import {
  enquirySchema,
  enquiryServices,
  type EnquiryFormValues,
  type EnquiryInput,
} from "@/lib/validation/enquiry";
import type { EnquiryServiceValue } from "@/types";

type EnquiryFormProps = { idPrefix: string; defaultService?: EnquiryServiceValue };

const inputClass =
  "block min-h-12 w-full rounded-[5px] border-[1.5px] border-line bg-salt px-3 py-2.5 text-base text-overnight placeholder:text-pebble focus:border-atlantic focus:outline-none focus:ring-3 focus:ring-atlantic/25 aria-[invalid=true]:border-error";

export function EnquiryForm({ idPrefix, defaultService }: EnquiryFormProps) {
  const uid = useId();
  const id = (name: string) => `${idPrefix}-${name}-${uid}`;
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormValues, unknown, EnquiryInput>({
    resolver: zodResolver(enquirySchema),
    mode: "onTouched",
    defaultValues: { name: "", company: "", email: "", phone: "", service: defaultService, message: "", website: "" },
  });

  // Move focus to the confirmation so keyboard and screen-reader users hear the result.
  useEffect(() => {
    if (status === "sent") statusRef.current?.focus();
  }, [status]);

  const onSubmit = async (values: EnquiryInput) => {
    setStatus("idle");
    const result = await submitEnquiry(values);
    if (result.ok) {
      reset();
      setStatus("sent");
      return;
    }
    if (result.fieldErrors) {
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        setError(field as keyof EnquiryInput, { message }, { shouldFocus: true });
      }
    }
    setServerMessage(result.message);
    setStatus("error");
  };

  if (status === "sent") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-brand border border-line bg-salt p-6 text-overnight sm:p-9"
      >
        <CheckCircle2 aria-hidden className="size-10 text-transit" />
        <h3 className="mt-4 text-[1.7rem]">Enquiry sent</h3>
        <p className="mt-2 text-ink-soft">
          Thank you for contacting Customs Wise. Your enquiry has been received and our team will get back to you shortly.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby={id("title")}
      className="rounded-brand border border-line bg-salt p-5.5 text-overnight sm:p-9"
    >
      <h3 id={id("title")} className="text-[1.6rem]">
        Enquiry form
      </h3>
      <p className="mt-1 text-[0.93rem] text-ink-soft">Fields marked optional can be left blank.</p>

      <div className="mt-5 grid gap-x-4.5 gap-y-4 sm:grid-cols-2">
        <Field id={id("name")} label="Name" error={errors.name}>
          <input id={id("name")} autoComplete="name" className={inputClass} {...a11y(id("name"), errors.name)} {...register("name")} />
        </Field>
        <Field id={id("company")} label="Company" optional error={errors.company}>
          <input id={id("company")} autoComplete="organization" className={inputClass} {...a11y(id("company"), errors.company)} {...register("company")} />
        </Field>
        <Field id={id("email")} label="Email" error={errors.email}>
          <input id={id("email")} type="email" autoComplete="email" inputMode="email" className={inputClass} {...a11y(id("email"), errors.email)} {...register("email")} />
        </Field>
        <Field id={id("phone")} label="Phone" optional error={errors.phone}>
          <input id={id("phone")} type="tel" autoComplete="tel" className={inputClass} {...a11y(id("phone"), errors.phone)} {...register("phone")} />
        </Field>
        <Field id={id("service")} label="What do you need help with?" error={errors.service} className="sm:col-span-2">
          <select id={id("service")} className={inputClass} {...a11y(id("service"), errors.service)} {...register("service")} defaultValue={defaultService ?? ""}>
            <option value="" disabled>
              Choose a service
            </option>
            {enquiryServices.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={id("message")} label="Tell us about your goods and route" error={errors.message} className="sm:col-span-2">
          <textarea
            id={id("message")}
            rows={5}
            placeholder="For example: chilled beef from Argentina into Dublin Port, weekly, container"
            className={cn(inputClass, "min-h-32 resize-y")}
            {...a11y(id("message"), errors.message)}
            {...register("message")}
          />
        </Field>
        {/* Honeypot: visually hidden and skipped by keyboard and screen readers */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={id("website")}>Leave this field empty</label>
          <input id={id("website")} tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-5 rounded-r-[5px] border-l-4 border-error bg-mist px-4 py-3 text-[0.95rem] font-semibold text-error">
          {serverMessage}
        </p>
      )}

      <Button type="submit" className="mt-5" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden className="animate-spin" /> Sending...
          </>
        ) : (
          <>
            Send enquiry <ArrowRight aria-hidden />
          </>
        )}
      </Button>
      <p className="mt-4 text-[0.84rem] text-ink-soft">
        We use your details only to reply to this enquiry. Read our{" "}
        <a href={site.privacyPolicy} target="_blank" rel="noopener noreferrer" className="text-atlantic underline underline-offset-3">
          privacy policy<span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
    </form>
  );
}

function a11y(fieldId: string, error?: FieldError) {
  return { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${fieldId}-error` : undefined };
}

function Field({
  id,
  label,
  optional,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: FieldError;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[0.9rem] font-semibold">
        {label} {optional && <span className="font-normal text-pebble">(optional)</span>}
      </label>
      {children}
      {error?.message && (
        <p id={`${id}-error`} className="mt-1.5 text-[0.85rem] font-semibold text-error">
          {error.message}
        </p>
      )}
    </div>
  );
}
