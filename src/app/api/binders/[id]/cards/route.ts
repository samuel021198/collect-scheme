import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { removeBinderCard, setBinderCard } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

async function gate() {
  if (!databaseUrl()) return { error: NextResponse.json({ error: "unavailable" }, { status: 503 }) };
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "auth" }, { status: 401 }) };
  return { user };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const gateResult = await gate();
  if ("error" in gateResult && gateResult.error) return gateResult.error;
  const { id } = await context.params;
  let body: { cardId?: unknown; status?: unknown; finish?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = await setBinderCard(gateResult.user.id, id, body.cardId, body.status ?? "wishlist", body.finish);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "full" ? 409 : 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const gateResult = await gate();
  if ("error" in gateResult && gateResult.error) return gateResult.error;
  const { id } = await context.params;
  let body: { cardId?: unknown; status?: unknown; finish?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = await setBinderCard(gateResult.user.id, id, body.cardId, body.status, body.finish);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const gateResult = await gate();
  if ("error" in gateResult && gateResult.error) return gateResult.error;
  const { id } = await context.params;
  const cardId = new URL(request.url).searchParams.get("card") ?? "";
  const result = await removeBinderCard(gateResult.user.id, id, cardId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
