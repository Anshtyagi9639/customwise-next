import "server-only";
import type { EnquiryInput } from "@/lib/validation/enquiry";
import { enquiryServices } from "@/lib/validation/enquiry";

/**
 * Sends enquiry notification emails through Resend (https://resend.com) using its REST API.
 * Server-side only: the API key never reaches the browser.
 *
 * Required environment variables:
 *   EMAIL_API_KEY     Resend API key (starts with "re_")
 *   ENQUIRY_TO_EMAIL  Recipient of enquiry notifications
 *   EMAIL_FROM        Verified sender, e.g. "Customs Wise Website <enquiries@customswise.ie>"
 * Optional:
 *   EMAIL_API_URL     Override the API endpoint (defaults to Resend; used for testing)
 */

export type EmailOutcome = { sent: true; id?: string } | { sent: false; reason: "not-configured" | "failed" };

const SUBJECT = "New Customs Wise Website Enquiry";

/** Escape user text for safe inclusion in HTML (prevents injected markup/scripts in the email). */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Remove control characters (including CR/LF) from single-line values to prevent header injection. */
function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/** Keep line breaks in the message but strip other control characters. */
function multiLine(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
}

function formatSubmittedAt(date: Date): string {
  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(date);
}

export function buildEnquiryEmail(enquiry: EnquiryInput, submittedAt = new Date()) {
  const fields: [string, string][] = [
    ["Name", singleLine(enquiry.name)],
    ["Email", singleLine(enquiry.email)],
    ["Phone", singleLine(enquiry.phone) || "Not provided"],
    ["Company", singleLine(enquiry.company) || "Not provided"],
    ["Service", enquiryServices.find((s) => s.value === enquiry.service)?.label ?? singleLine(enquiry.service)],
  ];
  const message = multiLine(enquiry.message);
  const when = `${formatSubmittedAt(submittedAt)} (Irish time)`;

  const text = [
    "New Website Enquiry",
    "",
    ...fields.flatMap(([k, v]) => [`${k}:`, v, ""]),
    "Message:",
    message,
    "",
    "Submitted from:",
    "Customs Wise Website",
    "",
    "Submitted at:",
    when,
  ].join("\n");

  const row = (k: string, v: string) =>
    `<tr><th align="left" valign="top" style="padding:8px 16px 8px 0;color:#4a6876;font-weight:600;white-space:nowrap">${k}</th><td style="padding:8px 0;color:#000315">${escapeHtml(v)}</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f1f5f7;font-family:'Open Sans',Arial,sans-serif;font-size:15px;line-height:1.5">
<table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:6px;overflow:hidden">
<tr><td style="background:#0a3542;padding:20px 24px;color:#ffffff;font-size:20px;font-weight:700">New Website Enquiry <span style="color:#f9ed32">&middot; Customs Wise</span></td></tr>
<tr><td style="padding:20px 24px">
<table role="presentation" style="border-collapse:collapse">${fields.map(([k, v]) => row(k, v)).join("")}</table>
<p style="margin:16px 0 6px;color:#4a6876;font-weight:600">Message</p>
<div style="white-space:pre-wrap;padding:12px 14px;background:#f1f5f7;border-left:4px solid #f79420;border-radius:0 4px 4px 0;color:#000315">${escapeHtml(message)}</div>
<p style="margin:20px 0 0;color:#747576;font-size:13px">Submitted from: Customs Wise Website<br>Submitted at: ${escapeHtml(when)}</p>
<p style="margin:12px 0 0;color:#747576;font-size:13px">Reply to this email to respond directly to ${escapeHtml(fields[0][1])}.</p>
</td></tr></table></body></html>`;

  return { subject: SUBJECT, text, html, replyTo: singleLine(enquiry.email) };
}

export async function sendEnquiryEmail(enquiry: EnquiryInput): Promise<EmailOutcome> {
  const apiKey = process.env.EMAIL_API_KEY;
  const to = process.env.ENQUIRY_TO_EMAIL;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !to || !from) {
    const missing = [!apiKey && "EMAIL_API_KEY", !to && "ENQUIRY_TO_EMAIL", !from && "EMAIL_FROM"].filter(Boolean).join(", ");
    console.error(`[enquiry-email] Not configured: missing ${missing}. The enquiry was NOT sent.`);
    return { sent: false, reason: "not-configured" };
  }

  const email = buildEnquiryEmail(enquiry);
  try {
    const res = await fetch(process.env.EMAIL_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()).filter(Boolean),
        reply_to: email.replyTo, // the visitor's address: replies go straight to them. Never used as "from".
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) {
      // Log provider detail server-side only; the visitor sees a generic message.
      console.error(`[enquiry-email] Provider rejected the email: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 500));
      return { sent: false, reason: "failed" };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    console.info(`[enquiry-email] Enquiry email accepted by provider${data.id ? ` (id ${data.id})` : ""}.`);
    return { sent: true, id: data.id };
  } catch (error) {
    console.error("[enquiry-email] Request to email provider failed", error);
    return { sent: false, reason: "failed" };
  }
}
