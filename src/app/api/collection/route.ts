import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { addCollection } from "@/lib/collection";
import { databaseUrl } from "@/lib/db";

export async function POST(request: Request) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  let body: { cardId?: unknown; condition?: unknown; grade?: unknown; quantity?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = await addCollection(user.id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id, quantity: result.quantity });
}
