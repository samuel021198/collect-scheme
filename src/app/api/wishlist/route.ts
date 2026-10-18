import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { databaseUrl } from "@/lib/db";
import { toggleWish, wishState } from "@/lib/wishlist";

export async function GET(request: Request) {
  const cardId = new URL(request.url).searchParams.get("card") ?? "";
  const user = await currentUser();
  if (!user) return NextResponse.json({ signedIn: false, wished: false });
  return NextResponse.json({ signedIn: true, wished: await wishState(user.id, cardId) });
}

export async function POST(request: Request) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  let body: { cardId?: unknown } = {};
  try {
    body = (await request.json()) as { cardId?: unknown };
  } catch {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  const result = await toggleWish(user.id, typeof body.cardId === "string" ? body.cardId : "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, wished: result.wished });
}
