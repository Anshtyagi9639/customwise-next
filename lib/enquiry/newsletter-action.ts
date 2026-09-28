"use server";

import { newsletterSchema, type NewsletterResult } from "@/lib/validation/newsletter";
import { isRateLimited } from "./rate-limit";
import { clientIp, postToWebhook } from "./webhook";
import { site } from "@/lib/site";

/**
 * Newsletter sign-up. Sends { email } to NEWSLETTER_WEBHOOK_URL (e.g. a mailing-list provider or automation tool).
 * Nothing is stored by the website itself. Without the webhook, the visitor is told sign-up isn't open yet.
 */
export async function subscribeToNewsletter(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your email address." };
  if (parsed.data.company_site) return { ok: true };
  if (isRateLimited(`newsletter:${await clientIp()}`)) return { ok: false, message: "Too many attempts. Please try again in a few minutes." };

  const outcome = await postToWebhook(process.env.NEWSLETTER_WEBHOOK_URL, process.env.NEWSLETTER_WEBHOOK_SECRET, {
    type: "newsletter_signup",
    receivedAt: new Date().toISOString(),
    email: parsed.data.email,
    source: "customswise-website",
  });
  if (outcome.delivered) return { ok: true };
  if (outcome.reason === "not-configured") {
    return {
      ok: false,
      notConfigured: true,
      message: `Newsletter sign-up isn't open yet, so your email hasn't been saved. For updates now, email ${site.email}.`,
    };
  }
  return { ok: false, message: "We couldn't complete your sign-up just now. Please try again later." };
}
