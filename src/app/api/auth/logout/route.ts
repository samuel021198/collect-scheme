import { NextResponse } from "next/server";
import { logoutAccount, sessionCookie } from "@/lib/auth";

export async function POST() {
  await logoutAccount();
  const cookie = sessionCookie("");
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, "", { ...cookie.options, maxAge: 0 });
  return response;
}
