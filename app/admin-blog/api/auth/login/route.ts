import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGN_IN_FAILED, SIGN_IN_LOCKED, SIGN_IN_NOT_CONFIGURED } from "@/cms/lib/auth-shared";
import { envAdmin, logSettingsAdminOff } from "@/cms/server/auth/env-admin";
import { createEnvSession, envAdminUser } from "@/cms/server/auth/env-sessions";
import { AuthStoreError } from "@/cms/server/auth/file-store";
import { landingPage } from "@/cms/server/auth/guard";
import { runAs } from "@/cms/server/auth/actor";
import { verifyPassword } from "@/cms/server/auth/password";
import { clientIp, isSameOriginRequest } from "@/cms/server/auth/request";
import { createSession, sessionCookie } from "@/cms/server/auth/sessions";
import { clearFailures, lockedFor, memoryClearFailures, memoryLockedFor, memoryRecordFailure, recordFailure, throttleKeys } from "@/cms/server/auth/throttle";
import { findUserByEmail, toAdminUser, usersCollection } from "@/cms/server/auth/users";
import { json } from "@/cms/server/http";
import { audit, mutateDb } from "@/cms/server/store";
import { StoreUnavailableError } from "@/cms/server/store-errors";

const input = z.object({
  email: z.string().trim().toLowerCase().min(3).max(254).regex(/^[^\s@]+@[^\s@]+$/),
  password: z.string().min(1).max(1000),
});

/** Sign in. The answer never says whether the account exists; every failure costs the same password check. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "forbidden", message: "This request was not sent from the CMS." }, 403);
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return json({ error: "invalid", message: "Enter your email address and password." }, 400);

  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid", message: "Enter your email address and password." }, 400);
  const { email, password } = parsed.data;
  const ip = clientIp(request);
  const keys = throttleKeys(email, ip);

  // The administrator from the server settings (ADMIN_EMAIL / ADMIN_PASSWORD_HASH): checked against those settings
  // only, with an in-memory session and rate limit, so it works while the database cannot be reached. No database
  // account is created. See cms/server/auth/env-admin.ts and env-sessions.ts.
  const env = envAdmin();
  if (env.state === "invalid") return json({ error: "unavailable", message: SIGN_IN_NOT_CONFIGURED }, 503);
  if (env.state === "ok" && email === env.email) {
    const lockedMs = memoryLockedFor([keys.email, keys.ip]);
    if (lockedMs > 0) return json({ error: "locked", message: SIGN_IN_LOCKED }, 429, { "Retry-After": String(Math.ceil(lockedMs / 1000)) });
    if (!(await verifyPassword(password, env.passwordHash))) {
      memoryRecordFailure([keys.email, keys.ip]);
      console.warn(`[auth] failed sign-in from ${ip}`);
      return json({ error: "invalid", message: SIGN_IN_FAILED }, 401);
    }
    memoryClearFailures(keys.email);
    console.info(`[auth] administrator from the server settings signed in from ${ip}`);
    let token: string;
    try {
      token = createEnvSession(env);
    } catch (err) {
      if (err instanceof AuthStoreError) return json({ error: "unavailable", message: "Sign-in is not available at the moment. Try again shortly." }, 503);
      throw err;
    }
    const res = NextResponse.json({ ok: true, redirect: landingPage(envAdminUser(env)) }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(token));
    return res;
  }

  // Every other account: the database. Failures counted in memory while it was unreachable also count here.
  if (env.state === "ok") {
    const lockedMs = memoryLockedFor([keys.email, keys.ip]);
    if (lockedMs > 0) return json({ error: "locked", message: SIGN_IN_LOCKED }, 429, { "Retry-After": String(Math.ceil(lockedMs / 1000)) });
  }
  try {
    const lockedMs = await lockedFor([keys.email, keys.ip]);
    if (lockedMs > 0) return json({ error: "locked", message: SIGN_IN_LOCKED }, 429, { "Retry-After": String(Math.ceil(lockedMs / 1000)) });

    const doc = await findUserByEmail(email);
    // A missing account still runs a full password check, so the time taken does not reveal it.
    const passwordOk = await verifyPassword(password, doc?.passwordHash);
    if (!doc || !passwordOk || doc.status !== "active") {
      await recordFailure([keys.email, keys.ip]);
      console.warn(`[auth] failed sign-in from ${ip}`);
      return json({ error: "invalid", message: SIGN_IN_FAILED }, 401);
    }

    await clearFailures(keys.email);
    const user = toAdminUser(doc);
    const token = await createSession(user, { ip, userAgent: request.headers.get("user-agent") ?? "" });
    await (await usersCollection()).updateOne({ _id: user.id }, { $set: { lastLoginAt: new Date() } });
    await runAs(user.email, () => mutateDb((db) => audit(db, { siteId: null, action: "auth.sign_in", targetId: user.id, summary: user.email })));

    const res = NextResponse.json({ ok: true, redirect: landingPage(user) }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (err) {
    if (err instanceof StoreUnavailableError) {
      // With an administrator in the server settings, a sign-in that does not match it is simply invalid credentials,
      // even while database accounts cannot be checked (the cause is in the server log). Without one, the database
      // is the only way in, so say that it cannot be reached.
      if (env.state === "ok") {
        memoryRecordFailure([keys.email, keys.ip]);
        return json({ error: "invalid", message: SIGN_IN_FAILED }, 401);
      }
      logSettingsAdminOff();
      return json({ error: "unavailable", message: "Sign-in is not available at the moment because the CMS database cannot be reached. Try again shortly." }, 503);
    }
    throw err;
  }
}
