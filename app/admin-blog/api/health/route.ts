import { linkBaseUrl, signInSender } from "@/cms/server/auth/email-link";
import { envAdmin } from "@/cms/server/auth/env-admin";
import { authStoreWritable } from "@/cms/server/auth/file-store";
import { imageStoreKind } from "@/cms/server/cloudinary";
import { json } from "@/cms/server/http";
import { readDb, storeKind } from "@/cms/server/store";
import { StoreUnavailableError } from "@/cms/server/store-errors";

/**
 * Can the CMS work on this server? 200 only after the database has actually been queried; 503 otherwise.
 * Public, so it reports only names and coarse statuses: which settings are missing (by name, never a value), whether
 * the database answered (and the kind of failure if not), the blog source, whether email sign-in is set up and whether
 * sign-in records can be written. Never a value, a path, a host name, a count or an error message from a library.
 * It never sends an email and is not logged on each call (the database logs its own failures, at most once a minute).
 */
const REQUIRED = ["NEXT_PUBLIC_SITE_URL", "MONGODB_URI", "MONGODB_DB", "BLOG_SOURCE", "ADMIN_EMAIL", "EMAIL_API_KEY", "EMAIL_FROM", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const;
const OPTIONAL = ["CMS_PUBLIC_URL", "CMS_EMAIL_FROM", "ADMIN_PASSWORD_HASH", "RESEND_READ_API_KEY", "CMS_AUTH_DIR"] as const;
const isSet = (name: string) => !!process.env[name]?.trim();

export async function GET() {
  const blogSource = process.env.BLOG_SOURCE?.trim().toLowerCase() === "cms" ? "cms" : "static";
  const sender = signInSender();
  const admin = envAdmin();
  const email = {
    adminEmail: admin.state === "ok" ? "set" : admin.state === "off" ? "missing" : "invalid",
    apiKey: isSet("EMAIL_API_KEY") ? "set" : "missing",
    sender: !sender ? (isSet("CMS_EMAIL_FROM") || isSet("EMAIL_FROM") ? "invalid" : "missing") : sender.testSender ? "resend-test-sender (delivers only to the Resend account owner)" : "own-domain",
    linkAddress: linkBaseUrl("http://invalid.invalid/") ? "ok" : "missing-or-not-https",
  };
  const settings = {
    missing: REQUIRED.filter((n) => !isSet(n)).filter((n) => !(n === "EMAIL_FROM" && isSet("CMS_EMAIL_FROM"))),
    optionalSet: OPTIONAL.filter(isSet),
  };
  const common = {
    app: "running",
    blogSource,
    settings,
    emailSignIn: { ready: email.adminEmail === "set" && email.apiKey === "set" && email.sender !== "missing" && email.sender !== "invalid" && email.linkAddress === "ok", ...email },
    signInStore: authStoreWritable() ? "writable" : "not-writable",
    images: imageStoreKind(),
  };
  try {
    await readDb();
    // The website and the CMS are one application sharing one database: the public blog reads the CMS directly.
    const publicBlog = blogSource === "cms" ? "cms" : "built-in (BLOG_SOURCE is not cms)";
    return json({ ok: true, store: storeKind(), database: { ok: true }, publicBlog, ...common });
  } catch (err) {
    const reason = err instanceof StoreUnavailableError ? err.reason : "unreachable";
    const kind = err instanceof StoreUnavailableError ? err.kind : undefined;
    const message =
      reason === "not-configured"
        ? "The CMS database settings (MONGODB_URI, MONGODB_DB) are missing or invalid on the server."
        : "The CMS database could not be reached or read.";
    const publicBlog = blogSource === "cms" ? "built-in fallback (the CMS database cannot be read; articles only in the CMS are unavailable)" : "built-in (BLOG_SOURCE is not cms)";
    return json({ ok: false, reason, message, store: storeKind(), database: { ok: false, reason, ...(kind ? { kind } : {}) }, publicBlog, ...common }, 503);
  }
}
