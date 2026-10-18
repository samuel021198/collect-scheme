import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createBinder, listBinders } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

export async function GET() {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const binders = await listBinders(user.id);
  return NextResponse.json({ binders });
}

export async function POST(request: Request) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  let body: { name?: unknown; cardId?: unknown; status?: unknown; finish?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const card = body.cardId ? { cardId: body.cardId, status: body.status ?? "wishlist", finish: body.finish } : undefined;
  const result = await createBinder(user.id, body.name, card);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "full" ? 409 : 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
