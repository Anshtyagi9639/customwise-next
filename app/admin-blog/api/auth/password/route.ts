import { NextResponse } from "next/server";
import { z } from "zod";
import { SIGN_IN_LOCKED } from "@/cms/lib/auth-shared";
import { withAdmin } from "@/cms/server/auth/guard";
import { hashPassword, passwordProblem, verifyPassword } from "@/cms/server/auth/password";
import { clientIp } from "@/cms/server/auth/request";
import { createSession, endAllSessions, sessionCookie } from "@/cms/server/auth/sessions";
import { clearFailures, lockedFor, recordFailure, throttleKeys } from "@/cms/server/auth/throttle";
import { findUserById, usersCollection } from "@/cms/server/auth/users";
import { json } from "@/cms/server/http";
import { audit, mutateDb } from "@/cms/server/store";

const input = z.object({ currentPassword: z.string().min(1).max(1000), newPassword: z.string().max(1000) });

/** Change your own password. Every other session of the account is signed out; this one gets a fresh session. */
export async function POST(request: Request) {
  return withAdmin(request, {}, async (user) => {
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return json({ error: "invalid", message: "Enter your current password and a new password.", fieldErrors: {} }, 400);
    const { currentPassword, newPassword } = parsed.data;

    const keys = throttleKeys(user.email, clientIp(request));
    const lockedMs = await lockedFor([keys.email]);
    if (lockedMs > 0) return json({ error: "locked", message: SIGN_IN_LOCKED }, 429);

    const doc = await findUserById(user.id);
    if (!doc || !(await verifyPassword(currentPassword, doc.passwordHash))) {
      await recordFailure([keys.email]);
      return json({ error: "invalid", message: "Some details need attention.", fieldErrors: { currentPassword: "Your current password is not correct." } }, 400);
    }
    const problem = passwordProblem(newPassword, user.email);
    if (problem) return json({ error: "invalid", message: "Some details need attention.", fieldErrors: { newPassword: problem } }, 400);
    if (await verifyPassword(newPassword, doc.passwordHash)) return json({ error: "invalid", message: "Some details need attention.", fieldErrors: { newPassword: "Choose a password different from your current one." } }, 400);

    const now = new Date();
    await (await usersCollection()).updateOne({ _id: user.id }, { $set: { passwordHash: await hashPassword(newPassword), passwordChangedAt: now, updatedAt: now } });
    await clearFailures(keys.email);
    // Sessions that began before the change are no longer accepted (see sessions.ts); remove them now as well.
    const signedOut = await endAllSessions(user.id);
    const token = await createSession(user, { ip: clientIp(request), userAgent: request.headers.get("user-agent") ?? "" });
    await mutateDb((db) => audit(db, { siteId: null, action: "auth.password_change", targetId: user.id, summary: `${user.email} (${signedOut} session${signedOut === 1 ? "" : "s"} ended)` }));

    const res = NextResponse.json({ ok: true, message: "Password changed. Any other signed-in sessions have been signed out." }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(sessionCookie(token));
    return res;
  });
}
