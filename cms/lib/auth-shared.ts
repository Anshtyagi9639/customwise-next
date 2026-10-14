/**
 * Sign-in constants shared by the proxy, the server and the login form. No secrets here.
 */

/**
 * The session cookie. "__Secure-" makes browsers accept it only with the Secure flag (HTTPS, or localhost for testing).
 * It is scoped to /admin-blog, so it is never sent with requests for the public website.
 */
export const SESSION_COOKIE = "__Secure-cw_admin";
export const SESSION_COOKIE_PATH = "/admin-blog";

/** A session ends after 2 hours without activity, and in any case 12 hours after signing in. */
export const SESSION_IDLE_MS = 2 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

/** Shown for every failed sign-in, whatever the reason, so the response never reveals whether an account exists. */
export const SIGN_IN_FAILED = "The email address or password is incorrect.";
export const SIGN_IN_LOCKED = "Too many sign-in attempts. Wait 15 minutes, then try again.";
