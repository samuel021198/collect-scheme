import { NextResponse } from "next/server";
import { registerAccount, sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; name?: unknown } = {};
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown; name?: unknown };
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = await registerAccount(body);
  if (!result.ok) {
    const status = result.error === "taken" ? 409 : result.error === "unavailable" ? 503 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  const cookie = sessionCookie(result.token);
  const response = NextResponse.json({ ok: true, name: result.user.name });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
