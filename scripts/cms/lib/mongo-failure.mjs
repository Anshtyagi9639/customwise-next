/**
 * Why a MongoDB request failed, as a category and what to do about it, for the server log. The driver's own messages
 * can contain host names, so only error names and codes are read here, and nothing from them is returned except the
 * name and code of the outermost error. The same as cms/server/mongo-failure.ts, for the command-line tools.
 */

const ADVICE = {
  authentication: "the database user name or password in MONGODB_URI was rejected (check them in Atlas → Database Access, and URL-encode special characters in the password)",
  "network-access": "Atlas refused this server's IP address (add it in Atlas → Network Access)",
  dns: "the cluster address in MONGODB_URI could not be found (check the host name, or the server's DNS)",
  network: "the database server could not be reached (connection refused, reset or timed out)",
  permission: "the database user may not use this database (give it readWrite on MONGODB_DB in Atlas → Database Access)",
  timeout: "no database server answered in time",
  unknown: "unexpected database error",
};

/** The error and everything underneath it: causes, and the error of every server the driver tried. */
function chain(err, seen = new Set()) {
  if (!err || typeof err !== "object" || seen.has(err)) return [];
  seen.add(err);
  const e = err;
  const out = [e, ...chain(e.cause, seen)];
  if (e.reason?.servers instanceof Map) for (const s of e.reason.servers.values()) out.push(...chain(s?.error, seen));
  return out;
}

export function mongoFailure(err) {
  const all = chain(err);
  const text = all.map((e) => `${String(e.name ?? "")} ${String(e.code ?? "")} ${String(e.codeName ?? "")} ${String(e.message ?? "")}`).join(" | ");
  const codes = new Set(all.map((e) => e.code));
  const kind =
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
                : "unknown";
  const top = err ?? {};
  const summary = `${String(top.name ?? "Error")}${top.code !== undefined ? ` code=${String(top.code)}` : ""}${top.codeName ? ` (${String(top.codeName)})` : ""}`;
  return { kind, advice: ADVICE[kind], summary };
}
