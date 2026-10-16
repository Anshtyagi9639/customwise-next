// What happened to an email after Resend accepted it: delivered, bounced, marked as spam, still being sent...
//   npm run cms:email-status -- <id>         (the id is in the server log: "accepted by the provider (id ...)")
// Resend only shows this to an API key with full access. The website's EMAIL_API_KEY is usually "sending access" only,
// so put a full-access key in .env as RESEND_READ_API_KEY (Resend → API Keys → Create, permission "Full access").
// Prints only the delivery status, the masked recipient, the sender's domain and the time. Never the key or the email.
import { existsSync } from "node:fs";
import path from "node:path";

for (const file of [".env.local", ".env"]) if (existsSync(path.join(process.cwd(), file))) process.loadEnvFile(path.join(process.cwd(), file));
const id = process.argv[2]?.trim();
if (!id || !/^[0-9a-f-]{20,}$/i.test(id)) {
  console.error("Give the email's id from the server log: npm run cms:email-status -- 01a1...");
  process.exit(1);
}
const key = (process.env.RESEND_READ_API_KEY || process.env.EMAIL_API_KEY || "").trim();
if (!key) {
  console.error("No Resend API key: set RESEND_READ_API_KEY (full access) in .env.");
  process.exit(1);
}

const MEANING = {
  queued: "waiting to be sent",
  scheduled: "scheduled for later",
  sent: "sent by Resend; the recipient's mail server has not confirmed it yet",
  delivered: "DELIVERED: the recipient's mail server accepted it (look in Inbox, Promotions and Spam)",
  delivery_delayed: "delayed: the recipient's mail server is not accepting it yet; Resend keeps trying",
  bounced: "BOUNCED: the recipient's mail server refused it",
  suppressed: "SUPPRESSED: Resend did not send it, because this address bounced or complained before (Resend → Suppressions)",
  complained: "delivered, but marked as spam by the recipient",
  failed: "FAILED: Resend could not send it",
  canceled: "canceled",
  opened: "delivered and opened",
  clicked: "delivered, opened, and a link was clicked",
};

// It only reads; it never sends. EMAIL_API_URL (the send endpoint, replaced in tests) gives the address to read from.
const endpoint = (process.env.EMAIL_API_URL?.trim() || "https://api.resend.com/emails").replace(/\/+$/, "");
let res;
try {
  res = await fetch(`${endpoint}/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
} catch (err) {
  console.error(`Resend could not be reached (${err?.name ?? "Error"}). Nothing was sent.`);
  process.exit(1);
}
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  if (body?.name === "restricted_api_key") {
    console.error("This API key may only send emails, so Resend will not show what happened to them.");
    console.error("Create a key with Full access in Resend → API Keys, add it to .env as RESEND_READ_API_KEY=..., and run this again.");
  } else if (res.status === 404) {
    console.error("Resend has no email with this id in this account (check the id, and that the key belongs to the same Resend account).");
  } else {
    console.error(`Resend answered ${res.status}: ${String(body?.message ?? "").slice(0, 200)}`);
  }
  process.exit(1);
}
const mask = (a) => String(a).replace(/^(.)[^@]*@/, "$1•••@");
console.log(`Email ${id}`);
console.log(`  to:          ${(body.to ?? []).map(mask).join(", ")}`);
console.log(`  from domain: ${String(body.from ?? "").replace(/.*@/, "").replace(/>.*/, "")}`);
console.log(`  created:     ${body.created_at ?? "?"}`);
console.log(`  status:      ${body.last_event ?? "?"} - ${MEANING[body.last_event] ?? "see the Resend dashboard"}`);
