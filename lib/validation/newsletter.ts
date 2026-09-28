import { z } from "zod";

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(200, "Email must be 200 characters or fewer.")
    .pipe(z.email("Enter an email address like name@company.com.")),
  /** Honeypot */
  company_site: z.string().max(200),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type NewsletterResult = { ok: true } | { ok: false; message: string; notConfigured?: boolean };
