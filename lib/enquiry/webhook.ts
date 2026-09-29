import "server-only";

export type DeliveryOutcome = { delivered: true } | { delivered: false; reason: "not-configured" | "failed" };

/**
 * Posts a JSON payload to a configured webhook. Used for enquiries so any
 * destination (email service, CRM, mailing-list provider, automation tool) can be connected without code changes.
 * If the webhook is not configured, nothing is stored and the caller must tell the visitor honestly.
 */
export async function postToWebhook(url: string | undefined, secret: string | undefined, payload: unknown): Promise<DeliveryOutcome> {
  if (!url) return { delivered: false, reason: "not-configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { Authorization: `Bearer ${secret}` } : {}) },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[webhook] ${url} responded ${res.status}`);
      return { delivered: false, reason: "failed" };
    }
    return { delivered: true };
  } catch (error) {
    console.error("[webhook] request failed", error);
    return { delivered: false, reason: "failed" };
  }
}

export async function clientIp(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
