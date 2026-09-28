import "server-only";
import type { EnquiryInput } from "@/lib/validation/enquiry";
import { enquiryServices } from "@/lib/validation/enquiry";
import { sendEnquiryEmail, type EmailOutcome } from "./email";
import { postToWebhook } from "./webhook";

/**
 * Delivers an enquiry. The email to ENQUIRY_TO_EMAIL is authoritative: the visitor only sees success
 * when the email provider has accepted the message. If ENQUIRY_WEBHOOK_URL is also set (e.g. a CRM),
 * a copy is posted there too; a webhook failure is logged but does not affect the email result.
 */
export async function deliverEnquiry(enquiry: EnquiryInput): Promise<EmailOutcome> {
  const outcome = await sendEnquiryEmail(enquiry);

  if (outcome.sent && process.env.ENQUIRY_WEBHOOK_URL) {
    const copy = await postToWebhook(process.env.ENQUIRY_WEBHOOK_URL, process.env.ENQUIRY_WEBHOOK_SECRET, {
      type: "website_enquiry",
      receivedAt: new Date().toISOString(),
      enquiry: {
        ...enquiry,
        website: undefined,
        serviceLabel: enquiryServices.find((s) => s.value === enquiry.service)?.label ?? enquiry.service,
      },
    });
    if (!copy.delivered) console.warn("[enquiry] Email sent, but the optional webhook copy failed.");
  }
  return outcome;
}
