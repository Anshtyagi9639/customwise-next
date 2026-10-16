import "server-only";
import type { Site } from "@/cms/lib/types";
import { StoreUnavailableError, readDb } from "./store";
import { findSite } from "./sites";

/** Small helpers shared by the route handlers. */

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/**
 * Wraps a public route so a database problem becomes a plain "temporarily unavailable" answer.
 * Nothing about the database (address, name, driver message) is ever included in a response.
 */
export function safely<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof StoreUnavailableError) return json({ error: "unavailable", message: "The content service is temporarily unavailable. Try again shortly." }, 503, { "Retry-After": "30" });
      throw err;
    }
  };
}

export const notFound = (message = "Not found.") => json({ error: "not_found", message }, 404);
export const badRequest = (message: string, fieldErrors: Record<string, string> = {}) => json({ error: "invalid", message, fieldErrors }, 400);

export async function siteByKey(key: string): Promise<Site | undefined> {
  return findSite(await readDb(), key);
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

