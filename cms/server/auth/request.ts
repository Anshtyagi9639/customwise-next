import "server-only";

/** Facts about an incoming request that the sign-in code needs. */

/**
 * The client's IP as reported by the hosting proxy. Used for rate limiting only, never trusted for anything else.
 * The LAST X-Forwarded-For entry is used: it is the one added by the proxy in front of Node.js (LiteSpeed on
 * Hostinger), while earlier entries are whatever the client chose to send, so a client cannot pick a fresh address to
 * escape the per-address limit. The limits that cover everyone (10 link emails per 15 minutes, the pause between
 * emails) do not depend on it at all.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return ip.replace(/[^0-9a-fA-F:.]/g, "").slice(0, 64) || "unknown";
}

function allowedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  for (const h of [request.headers.get("x-forwarded-host"), request.headers.get("host")]) if (h) hosts.add(h.split(",")[0].trim().toLowerCase());
  for (const u of [process.env.NEXT_PUBLIC_SITE_URL, process.env.CMS_PUBLIC_URL]) {
    try {
      if (u?.trim()) hosts.add(new URL(u.trim()).host.toLowerCase());
    } catch {}
  }
  return hosts;
}

/**
 * Cross-site request forgery check for every request that changes something: the browser must say the request came
 * from this website. Browsers always send Origin with POST, PUT and DELETE requests made by fetch; a request with no
 * Origin is accepted only if the browser marks it as same-origin. Together with the SameSite=Strict session cookie,
 * a page on another website cannot make a signed-in administrator's browser change anything.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  if (origin === "null") return false;
  try {
    return allowedHosts(request).has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}
