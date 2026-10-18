import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { addBinderPage } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  const { id } = await context.params;
  const result = await addBinderPage(user.id, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "full" ? 409 : 400 });
  return NextResponse.json({ ok: true, page: result.page });
}
