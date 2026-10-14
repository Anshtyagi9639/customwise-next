import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGN_IN_FAILED, SIGN_IN_LOCKED } from "@/cms/lib/auth-shared";
import { adminUrl } from "@/cms/lib/routes";
import { runAs } from "@/cms/server/auth/actor";
import { verifyPassword } from "@/cms/server/auth/password";
import { clientIp, isSameOriginRequest } from "@/cms/server/auth/request";
import { createSession, sessionCookie } from "@/cms/server/auth/sessions";
import { clearFailures, lockedFor, recordFailure, throttleKeys } from "@/cms/server/auth/throttle";
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

    const res = NextResponse.json({ ok: true, redirect: adminUrl.dashboard }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(token));
    return res;
  } catch (err) {
    if (err instanceof StoreUnavailableError) return json({ error: "unavailable", message: "Sign-in is not available at the moment because the CMS database cannot be reached. Try again shortly." }, 503);
    throw err;
  }
}
