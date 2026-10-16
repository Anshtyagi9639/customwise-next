/**
 * The only two errors the storage layer lets out. Their messages are safe to show: they never contain a connection
 * string, a host name, a user name or a driver message.
 */

/** A unique rule in the database refused the write, for example a slug already used on that website. */
export class StoreConflictError extends Error {
  constructor(public readonly collection: string) {
    super("A record with the same unique value already exists.");
    this.name = "StoreConflictError";
  }
}

/**
 * The database is not configured or could not be reached. `reason` is safe to show publicly (the health check reports
 * it): "not-configured" means MONGODB_URI or MONGODB_DB is missing or invalid on the server; "unreachable" means the
 * settings look right but connecting or reading failed (network access, credentials, the database server).
 */
export class StoreUnavailableError extends Error {
  constructor(
    message = "The content database could not be reached.",
    public readonly reason: "not-configured" | "unreachable" = "unreachable",
  ) {
    super(message);
    this.name = "StoreUnavailableError";
  }
}
