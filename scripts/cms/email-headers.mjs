// What a received email's own headers say about its authentication: SPF, DKIM, DMARC and whether they align with the
// visible sender. Evidence for "why is it in Spam?", instead of guesses. It only reads a local file; it connects to
// nothing and sends nothing. Addresses are masked and sign-in tokens are never printed.
//
//   In Gmail: open the email → ⋮ (More) → "Download message" (or "Show original" → "Download original"), then:
//   npm run cms:email-headers -- "C:\path\to\message.eml"
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error('Give the saved email: npm run cms:email-headers -- "path/to/message.eml"');
  process.exit(1);
}
let raw;
try {
  raw = readFileSync(file, "utf8");
} catch (err) {
  console.error(`Cannot read ${file}: ${err?.code ?? "error"}`);
  process.exit(1);
}

/** Headers, with folded (continued) lines joined. Only the part before the first blank line. */
const headerText = raw.split(/\r?\n\r?\n/)[0];
const headers = [];
for (const line of headerText.split(/\r?\n/)) {
  if (/^[ \t]/.test(line) && headers.length) headers[headers.length - 1].value += ` ${line.trim()}`;
  else {
    const m = line.match(/^([!-9;-~]+):\s*(.*)$/);
    if (m) headers.push({ name: m[1].toLowerCase(), value: m[2] });
  }
}
const all = (name) => headers.filter((h) => h.name === name).map((h) => h.value);
const first = (name) => all(name)[0] ?? "";
const mask = (text) => String(text).replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, "$1•••@$2");
const domainOf = (address) => (String(address).match(/@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/)?.[1] ?? "").toLowerCase();
// Alignment as DMARC sees it (relaxed): the same organisational domain, e.g. send.customswise.ie and customswise.ie.
const orgDomain = (d) => d.split(".").slice(-2).join(".");
const aligned = (a, b) => !!a && !!b && orgDomain(a) === orgDomain(b);

const fromDomain = domainOf(first("from"));
// The receiving provider's verdict (Gmail writes its own Authentication-Results at the top).
const results = all("authentication-results").join(" ; ");
const verdict = (method) => results.match(new RegExp(`\\b${method}=(\\w+)`, "i"))?.[1]?.toLowerCase() ?? "not reported";
const spf = verdict("spf");
const dkim = verdict("dkim");
const dmarc = verdict("dmarc");
const spfDomain = (results.match(/smtp\.mailfrom=[^\s;]*?@?([A-Za-z0-9.-]+\.[A-Za-z]{2,})/i)?.[1] ?? domainOf(first("return-path"))).toLowerCase();
const dkimDomains = [...new Set(all("dkim-signature").map((v) => (v.match(/\bd=([^;\s]+)/)?.[1] ?? "").toLowerCase()).filter(Boolean))];
const dmarcPolicy = results.match(/dmarc=\w+\s*\(p=(\w+)/i)?.[1] ?? "";

const body = raw.slice(headerText.length);
const linkHosts = [...new Set([...body.matchAll(/https?:\/\/([^/\s"'<>#?=]+)/gi)].map((m) => m[1].toLowerCase()))];

console.log(`Email: ${mask(first("subject")) || "(no subject)"}`);
console.log(`  visible sender:  ${mask(first("from")) || "(none)"}   (domain ${fromDomain || "?"})`);
console.log(`  SPF:             ${spf}${spfDomain ? ` for ${spfDomain}` : ""}${aligned(spfDomain, fromDomain) ? " (aligned with the sender)" : spfDomain ? " (NOT aligned with the sender's domain)" : ""}`);
console.log(`  DKIM:            ${dkim}${dkimDomains.length ? ` signed by ${dkimDomains.join(", ")}` : " (no DKIM signature)"}${dkimDomains.some((d) => aligned(d, fromDomain)) ? " (aligned)" : dkimDomains.length ? " (NOT aligned with the sender's domain)" : ""}`);
console.log(`  DMARC:           ${dmarc}${dmarcPolicy ? ` (policy p=${dmarcPolicy})` : ""}`);
console.log(`  links point to:  ${linkHosts.join(", ") || "(no links found)"}`);
const notes = [];
if (fromDomain === "resend.dev") notes.push("The sender is Resend's shared test domain (resend.dev): it only reaches the Resend account owner and is often filed as Spam. Send from your own verified domain.");
if (/customs\s*wise/i.test(first("from")) && fromDomain && !fromDomain.endsWith("customswise.ie")) notes.push(`The display name says Customs Wise but the address is on ${fromDomain}: a brand name on an unrelated domain is a common spam signal.`);
if (dmarc !== "pass" && dmarc !== "not reported") notes.push("DMARC did not pass: mailbox providers treat such mail with suspicion.");
if (spf !== "pass" && spf !== "not reported") notes.push("SPF did not pass for the sending domain.");
if (dkim !== "pass" && dkim !== "not reported") notes.push("DKIM did not pass.");
if (linkHosts.some((h) => /^(localhost|127\.|169\.254\.)/.test(h))) notes.push("The email links to this computer (localhost / 127.x / 169.254.x): normal for local development, but such links look odd to spam filters.");
if (linkHosts.some((h) => fromDomain && orgDomain(h) !== orgDomain(fromDomain) && !/^(localhost|127\.|169\.254\.)/.test(h))) notes.push("Links point to a different domain than the sender's: aligning them (send from @customswise.ie, link to customswise.ie) helps.");
console.log(notes.length ? `\nWhat this suggests:\n${notes.map((n) => `  - ${n}`).join("\n")}` : "\nNothing in these headers points to an authentication problem. Placement can still depend on reputation and content.");
