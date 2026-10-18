import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { moveSlot } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

function num(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  let body: { from?: { page?: unknown; row?: unknown; col?: unknown }; to?: { page?: unknown; row?: unknown; col?: unknown } } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const from = { page: num(body.from?.page), row: num(body.from?.row), col: num(body.from?.col) };
  const to = { page: num(body.to?.page), row: num(body.to?.row), col: num(body.to?.col) };
  if (from.page == null || from.row == null || from.col == null || to.page == null || to.row == null || to.col == null) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }
  const result = await moveSlot(user.id, id, { page: from.page, row: from.row, col: from.col }, { page: to.page, row: to.row, col: to.col });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
