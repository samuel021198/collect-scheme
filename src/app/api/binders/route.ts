import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createBinder, listBinders } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

export async function GET() {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  return NextResponse.json({ binders: await listBinders(user.id) });
}

export async function POST(request: Request) {
  if (!databaseUrl()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });
  let body: { name?: unknown; layout?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = await createBinder(user.id, body.name, body.layout);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.error === "full" ? 409 : 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
