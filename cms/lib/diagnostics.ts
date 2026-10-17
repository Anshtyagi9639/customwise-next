/**
 * The safe diagnostic details an admin error page can show, carried in the error's digest by the server
 * (cms/server/admin-data.ts CmsScreenError): "cmsdiag:<reference>:<operation>:<status>:<category>:<kind>".
 * Shared by the server and the browser. Nothing in it is secret: the reference is the request id of the matching
 * server log line, the rest are fixed words.
 */
export const CMS_DIAGNOSTIC_PREFIX = "cmsdiag";

export type CmsDiagnostic = { reference: string; operation: string; status: string; category: string; kind: string };

export function parseCmsDiagnostic(digest: string | undefined): CmsDiagnostic | null {
  const parts = digest?.split(":") ?? [];
  if (parts.length !== 6 || parts[0] !== CMS_DIAGNOSTIC_PREFIX || parts.some((p) => !/^[A-Za-z0-9._-]{1,64}$/.test(p))) return null;
  const [, reference, operation, status, category, kind] = parts;
  return { reference, operation, status, category, kind };
}

/** A short next step for each category (shown under the reference). */
export const NEXT_STEP: Record<string, string> = {
  "database-unreachable": "The server could not reach the CMS database. Check the server runtime logs for this reference: the [CMS_DB] line before it gives the exact reason (for example Atlas Network Access).",
  "database-authentication": "The CMS database refused the website's database user. Check the user name and password in MONGODB_URI, then the server runtime logs for this reference.",
  "database-permission": "The website's database user may not use the CMS database. Check its role in Atlas → Database Access, then the server runtime logs for this reference.",
  "database-query": "The database answered but a request failed. Check the server runtime logs for this reference.",
  "database-not-configured": "The CMS database settings are missing on the server. Check MONGODB_URI and MONGODB_DB, then the server runtime logs for this reference.",
  "database-invalid-record": "Some stored records are not in the expected shape. Check the server runtime logs for this reference.",
  unknown: "Check the server runtime logs using this reference.",
};
