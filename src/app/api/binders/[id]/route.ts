import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { binderView, deleteBinder, renameBinder, setBinderLayout } from "@/lib/binders";
import { databaseUrl } from "@/lib/db";

async function userOrError() {
  if (!databaseUrl()) return { error: NextResponse.json({ error: "unavailable" }, { status: 503 }) };
  const user = await currentUser();
  if (!user) return { error: NextResponse.json({ error: "auth" }, { status: 401 }) };
  return { user };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await userOrError();
  if ("error" in gate) return gate.error;
  const { id } = await context.params;
  const view = await binderView(gate.user.id, id);
  if (!view) return NextResponse.json({ error: "missing" }, { status: 404 });
  return NextResponse.json(view);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await userOrError();
  if ("error" in gate) return gate.error;
  const { id } = await context.params;
  let body: { name?: unknown; layout?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 400 });
  }
  const result = body.layout ? await setBinderLayout(gate.user.id, id, body.layout) : await renameBinder(gate.user.id, id, body.name);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const gate = await userOrError();
  if ("error" in gate) return gate.error;
  const { id } = await context.params;
  const result = await deleteBinder(gate.user.id, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
