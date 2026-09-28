import { z } from "zod";
import type { EnquiryServiceValue } from "@/types";

export const enquiryServices: { value: EnquiryServiceValue; label: string }[] = [
  { value: "import", label: "Import customs clearance" },
  { value: "export", label: "Export customs clearance" },
  { value: "food", label: "Food customs (POAO, fish, fresh produce)" },
  { value: "traces", label: "TRACES or IPAFFS entries" },
  { value: "t1", label: "T1 transit" },
  { value: "audit", label: "Customs audit" },
  { value: "worldwide", label: "Worldwide customs clearance" },
  { value: "other", label: "Something else" },
];

const serviceValues = enquiryServices.map((s) => s.value) as [EnquiryServiceValue, ...EnquiryServiceValue[]];

export function isEnquiryService(value: unknown): value is EnquiryServiceValue {
  return typeof value === "string" && (serviceValues as string[]).includes(value);
}

/** Shared by the client form (instant feedback) and the server action (authoritative). */
export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100, "Name must be 100 characters or fewer."),
  company: z.string().trim().max(150, "Company must be 150 characters or fewer."),
  email: z.string().trim().max(200, "Email must be 200 characters or fewer.").pipe(z.email("Enter an email address like name@company.com.")),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be 30 characters or fewer.")
    .regex(/^[+()\d\s-]*$/, "Use digits, spaces and + ( ) - only."),
  service: z.enum(serviceValues, { error: "Choose the service closest to your enquiry." }),
  message: z
    .string()
    .trim()
    .min(10, "Add a short description of what you're moving (at least 10 characters).")
    .max(3000, "Keep your message under 3,000 characters."),
  /** Honeypot: hidden from people, often filled by bots. */
  website: z.string().max(200),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryFormValues = z.input<typeof enquirySchema>;

export type EnquiryResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof EnquiryInput, string>> };
