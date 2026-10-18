import { rememberCard, rememberQuery } from "@/lib/searches";

export async function POST(request: Request) {
  let body: { id?: unknown; q?: unknown } = {};
  try {
    body = (await request.json()) as { id?: unknown; q?: unknown };
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (typeof body.id === "string") await rememberCard(body.id);
  else if (typeof body.q === "string") await rememberQuery(body.q);
  return Response.json({ ok: true });
}
