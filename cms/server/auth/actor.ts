import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Who is making the current change, for the activity log. Set by the admin API guard for the duration of a request,
 * so every record written while handling it is attributed to the signed-in administrator.
 */
const storage = new AsyncLocalStorage<string>();

export function runAs<T>(actor: string, fn: () => T): T {
  return storage.run(actor, fn);
}

export function currentActor(): string {
  return storage.getStore() ?? "system";
}
