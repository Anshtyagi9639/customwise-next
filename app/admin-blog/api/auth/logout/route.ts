import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/cms/lib/auth-shared";
import { adminUrl } from "@/cms/lib/routes";
import { AuthStoreError } from "@/cms/server/auth/file-store";
import { isSameOriginRequest } from "@/cms/server/auth/request";
import { clearedSessionCookie, endSession } from "@/cms/server/auth/sessions";
import { json } from "@/cms/server/http";
import { StoreUnavailableError } from "@/cms/server/store-errors";

/** Sign out: the session is deleted on the server, not just forgotten by the browser. */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "forbidden", message: "This request was not sent from the CMS." }, 403);
  try {
    await endSession((await cookies()).get(SESSION_COOKIE)?.value);
  } catch (err) {
    if (!(err instanceof StoreUnavailableError) && !(err instanceof AuthStoreError)) throw err;
    // The cookie is still cleared below; the server-side record expires by itself.
  }
  const res = NextResponse.json({ ok: true, redirect: adminUrl.login }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(clearedSessionCookie());
  return res;
}
