import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { placeInBinder } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

function num(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^-?\d+$/.test(value)) return Number(value);
  return undefined;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = await placeInBinder(user.id, id, {
    collectionItemId: body.collectionItemId,
    cardId: body.cardId,
    condition: body.condition,
    grade: body.grade,
    quantity: body.quantity,
    page: num(body.page),
    row: num(body.row),
    col: num(body.col),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "taken" || result.error === "full" ? 409 : 400 });
  return NextResponse.json({ ok: true, itemId: result.itemId });
}
