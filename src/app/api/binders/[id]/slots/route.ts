import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { clearSlot } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page"));
  const row = Number(url.searchParams.get("row"));
  const col = Number(url.searchParams.get("col"));
  if (![page, row, col].every((value) => Number.isInteger(value))) return NextResponse.json({ error: "missing" }, { status: 400 });
  const result = await clearSlot(user.id, id, page, row, col);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
