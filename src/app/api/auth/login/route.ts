import { NextResponse } from "next/server";
import { loginAccount, sessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown } = {};
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const result = await loginAccount(body);
  if (!result.ok) {
    const status = result.error === "unavailable" ? 503 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }
  const cookie = sessionCookie(result.token);
  const response = NextResponse.json({ ok: true, name: result.user.name });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
