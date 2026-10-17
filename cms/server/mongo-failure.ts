/**
 * Why a MongoDB request failed, as a category and what to do about it, for the server log. The driver's own messages
 * can contain host names, so only error names and codes are read here, and nothing from them is returned except the
 * name and code of the outermost error. scripts/cms/lib/mongo-failure.mjs is the same for the command-line tools.
 */

/**
 * network-access: Atlas ended the TLS handshake with alert 80 ("internal error"), which is how it turns away an IP
 * address that is not on its Network Access list. dns: the cluster name did not resolve. network: refused, reset or
 * unreachable. timeout: no server answered in time (the driver gave no more specific reason). query-failed: connected,
 * but a read or write failed for another reason. invalid-document: a stored record does not have the shape the CMS
 * needs (see doc-check.ts). unknown: none of these.
 */
export type MongoFailureKind = "authentication" | "network-access" | "dns" | "network" | "permission" | "timeout" | "query-failed" | "invalid-document" | "unknown";

const ADVICE: Record<MongoFailureKind, string> = {
  authentication: "the database user name or password in MONGODB_URI was rejected (check them in Atlas → Database Access, and URL-encode special characters in the password)",
  "network-access": "Atlas refused this server's IP address (add it in Atlas → Network Access)",
  dns: "the cluster address in MONGODB_URI could not be found (check the host name, or the server's DNS)",
  network: "the database server could not be reached (connection refused, reset or timed out)",
  permission: "the database user may not use this database (give it readWrite on MONGODB_DB in Atlas → Database Access)",
  timeout: "no database server answered in time (the driver gave no more specific reason: check Network Access, the cluster's state and the server's outgoing connections)",
  "query-failed": "connected, but the database refused or failed the request",
  "invalid-document": "a stored record does not have the shape the CMS needs",
  unknown: "unexpected database error",
};

type ErrorLike = { name?: unknown; code?: unknown; codeName?: unknown; message?: unknown; cause?: unknown; reason?: { servers?: Map<string, { error?: unknown }> } };

/** The error and everything underneath it: causes, and the error of every server the driver tried. */
function chain(err: unknown, seen = new Set<unknown>()): ErrorLike[] {
  if (!err || typeof err !== "object" || seen.has(err)) return [];
  seen.add(err);
  const e = err as ErrorLike;
  const out = [e, ...chain(e.cause, seen)];
  if (e.reason?.servers instanceof Map) for (const s of e.reason.servers.values()) out.push(...chain(s?.error, seen));
  return out;
}

/** `during`: "connection", or the read/write that failed (an unclassified failure after connecting is query-failed). */
export function mongoFailure(err: unknown, during = "connection"): { kind: MongoFailureKind; advice: string; summary: string } {
  const all = chain(err);
  const text = all.map((e) => `${String(e.name ?? "")} ${String(e.code ?? "")} ${String(e.codeName ?? "")} ${String(e.message ?? "")}`).join(" | ");
  const codes = new Set(all.map((e) => e.code));
  const kind: MongoFailureKind =
    codes.has(18) || codes.has(8000) || /AuthenticationFailed|Authentication failed|bad auth/i.test(text)
      ? "authentication"
      : /tlsv1 alert internal error|SSL alert number 80|ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR/i.test(text)
        ? "network-access"
        : /ENOTFOUND|EAI_AGAIN|ESERVFAIL|querySrv|queryTxt/i.test(text)
          ? "dns"
          : /ECONNREFUSED|ECONNRESET|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH/i.test(text)
            ? "network"
            : codes.has(13) || /Unauthorized|not authorized/i.test(text)
              ? "permission"
              : /MongoServerSelectionError|Server selection timed out/i.test(text)
                ? "timeout"
                : during === "connection"
                  ? "unknown"
                  : "query-failed";
  const top = (err ?? {}) as ErrorLike;
  const summary = `${String(top.name ?? "Error")}${top.code !== undefined ? ` code=${String(top.code)}` : ""}${top.codeName ? ` (${String(top.codeName)})` : ""}`;
  return { kind, advice: ADVICE[kind], summary };
}

/**
 * What can safely be said about MONGODB_URI, for the server log only (never the health check): its scheme, the first
 * label of its first host (for Atlas, the cluster's name, such as "blog-cms-cluster"), how many hosts, the database
 * written in its path (the driver's default for authentication, not the one the CMS reads) and whether authSource is
 * set. Never the user, the password, the full host name or other parameters. The host is taken after the LAST "@",
 * so a password containing "@" or "/" cannot end up in it.
 */
export function describeMongoUri(uri: string): Record<string, string | number | boolean> {
  const m = uri.match(/^(mongodb(?:\+srv)?):\/\/(.*)$/);
  if (!m) return { connection_string_set: uri !== "", scheme: "invalid" };
  const rest = m[2];
  const after = rest.slice(rest.lastIndexOf("@") + 1);
  const authority = after.split(/[/?]/)[0];
  const tail = after.slice(authority.length);
  const pathDb = tail.startsWith("/") ? decodeURIComponent(tail.slice(1).split("?")[0]) : "";
  const query = tail.includes("?") ? tail.slice(tail.indexOf("?") + 1) : "";
  const hosts = authority.split(",").filter(Boolean);
  const first = (hosts[0] ?? "").replace(/:\d+$/, "");
  const label = /^(\d+\.){3}\d+$/.test(first) || first === "localhost" ? first : first.split(".")[0];
  return { connection_string_set: true, scheme: m[1], cluster_label: label || "none", hosts: hosts.length, path_db: pathDb || "none", auth_source_set: /(^|&)authSource=/i.test(query) };
}
