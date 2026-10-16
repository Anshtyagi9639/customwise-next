/**
 * Sign-in constants shared by the proxy, the server and the login form. No secrets here.
 */

/**
 * The session cookie. "__Secure-" makes browsers accept it only with the Secure flag (HTTPS, or localhost for testing).
 * It is scoped to /admin-blog, so it is never sent with requests for the public website.
 *
 * Under `next dev` only, the cookie is a plain one without Secure, so signing in also works on a local http:// address
 * that is not localhost (such as the 169.254.x.x address next dev prints). A production build replaces
 * process.env.NODE_ENV with "production", so it always uses the __Secure- cookie with Secure.
 */
const LOCAL_DEV = process.env.NODE_ENV === "development";
export const SESSION_COOKIE = LOCAL_DEV ? "cw_admin_dev" : "__Secure-cw_admin";
export const SESSION_COOKIE_SECURE = !LOCAL_DEV;
export const SESSION_COOKIE_PATH = "/admin-blog";

/** A session ends after 2 hours without activity, and in any case 12 hours after signing in. */
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

/** Shown for every failed sign-in, whatever the reason, so the response never reveals whether an account exists. */
export const SIGN_IN_FAILED = "Invalid email or password.";
export const SIGN_IN_LOCKED = "Too many sign-in attempts. Wait 15 minutes, then try again.";
/** The server's sign-in settings (ADMIN_EMAIL / ADMIN_PASSWORD_HASH) are incomplete. Says which only in the server log. */
export const SIGN_IN_NOT_CONFIGURED = "Sign-in is not available at the moment because of a problem with the server's settings. Please contact the website administrator.";
