/**
 * TEMPORARY diagnostic: which public IP address does this server use for OUTGOING connections (the address MongoDB
 * Atlas sees, and must have on its Network Access list)? Remove this whole file once Atlas is configured.
 *
 * - Runs once per Next.js server process (register() is called on start-up), on the server only. There is no
 *   endpoint, no page and no browser code: the result is only written to the server log.
 * - Asks two independent, well-known IP-echo services over HTTPS and logs ONLY the address each returned, after
 *   checking that the answer is nothing but an IPv4 address. Nothing is sent to them but a plain GET.
 * - Never logs environment variables, the database settings or anything else.
 * - Does not delay start-up: the check runs in the background with a 5-second limit per service.
 * - Off with CMS_DEBUG=0 (like the other temporary diagnostics).
 *
 * The log line, in Hostinger's runtime (and build) log:
 *   2026-10-17T08:00:00.000Z [CMS_DIAG] outbound_ip phase=runtime ip=203.0.113.7 sources=api.ipify.org,checkip.amazonaws.com agree=true
 */

const SOURCES = ["https://api.ipify.org", "https://checkip.amazonaws.com"] as const;
const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

async function ask(url: string): Promise<{ source: string; ip?: string; error?: string }> {
  const source = new URL(url).host;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store", headers: { Accept: "text/plain" } });
    if (!res.ok) return { source, error: `HTTP ${res.status}` };
    const text = (await res.text()).trim();
    // Only an IPv4 address is ever logged; any other answer is reported as unexpected, without its content.
    return IPV4.test(text) ? { source, ip: text } : { source, error: "unexpected answer (not an IPv4 address)" };
  } catch (err) {
    const e = err as { name?: string; cause?: { code?: string } };
    return { source, error: `${e?.name ?? "Error"}${e?.cause?.code ? ` ${e.cause.code}` : ""}` };
  }
}

async function logOutboundIp() {
  const phase = process.env.NEXT_PHASE === "phase-production-build" ? "build" : "runtime";
  const results = await Promise.all(SOURCES.map(ask));
  const ips = [...new Set(results.flatMap((r) => (r.ip ? [r.ip] : [])))];
  const failures = results.filter((r) => r.error).map((r) => `${r.source}: ${r.error}`);
  const line = [
    new Date().toISOString(),
    "[CMS_DIAG] outbound_ip",
    `phase=${phase}`,
    `ip=${ips.join(",") || "unknown"}`,
    `sources=${results.filter((r) => r.ip).map((r) => r.source).join(",") || "none"}`,
    `agree=${ips.length === 1 && failures.length === 0}`,
    `node=${process.version}`,
    `openssl=${process.versions.openssl}`,
    ...(failures.length ? [`errors=${JSON.stringify(failures.join("; "))}`] : []),
  ].join(" ");
  if (ips.length) console.info(line);
  else console.warn(line);
}

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.CMS_DEBUG?.trim() === "0") return;
  // In the background: start-up never waits for, or fails because of, this check.
  void logOutboundIp().catch(() => undefined);
}
