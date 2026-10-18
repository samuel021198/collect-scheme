import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { deleteBinder, renameBinder, setBinderCover } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

async function gate() {
  if (!databaseUrl()) return { error: NextResponse.json({ error: "unavailable" }, { status: 503 }) };
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "auth" }, { status: 401 }) };
  return { user };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const gateResult = await gate();
  if ("error" in gateResult && gateResult.error) return gateResult.error;
  const { id } = await context.params;
  let body: { name?: unknown; coverCardId?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = body.coverCardId
    ? await setBinderCover(gateResult.user.id, id, body.coverCardId)
    : await renameBinder(gateResult.user.id, id, body.name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gateResult = await gate();
  if ("error" in gateResult && gateResult.error) return gateResult.error;
  const { id } = await context.params;
  const result = await deleteBinder(gateResult.user.id, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
