"use server";

import { enquirySchema, type EnquiryInput, type EnquiryResult } from "@/lib/validation/enquiry";
import { deliverEnquiry } from "./deliver";
import { isRateLimited } from "./rate-limit";
import { clientIp } from "./webhook";

const SEND_FAILED = "We couldn't send your enquiry right now. Please try again or contact us directly.";

/** Server-side enquiry handler: validates, filters spam, and sends the enquiry email. */
export async function submitEnquiry(input: unknown): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof EnquiryInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof EnquiryInput | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Some details need attention.", fieldErrors };
  }

  // Honeypot filled (bots): report success so they learn nothing, but send nothing.
  if (parsed.data.website) return { ok: true };

  if (isRateLimited(`enquiry:${await clientIp()}`)) {
    return { ok: false, message: "Too many enquiries have been sent from this connection. Please wait a few minutes and try again." };
  }

  const outcome = await deliverEnquiry(parsed.data);
  // Success is only reported when the email provider has accepted the message.
  return outcome.sent ? { ok: true } : { ok: false, message: SEND_FAILED };
}
