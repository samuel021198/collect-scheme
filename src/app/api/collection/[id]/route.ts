import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { dropCollection } from "@/lib/collection";
import { databaseUrl } from "@/lib/db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  let body: { quantity?: unknown } = {};
  try {
    body = (await request.json()) as { quantity?: unknown };
  } catch {
    return NextResponse.json({ error: "quantity" }, { status: 400 });
  }
  const result = await dropCollection(user.id, id, body.quantity);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "missing" ? 404 : 400 });
  return NextResponse.json({ ok: true, quantity: result.quantity });
}
