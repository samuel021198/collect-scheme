import { parsePrintLang } from "@/lib/catalog";
import { rememberCard, rememberQuery } from "@/lib/searches";

export async function POST(request: Request) {
  let body: { id?: unknown; q?: unknown; lang?: unknown } = {};
  try {
    body = (await request.json()) as { id?: unknown; q?: unknown; lang?: unknown };
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (typeof body.id === "string") await rememberCard(body.id);
  else if (typeof body.q === "string") {
    await rememberQuery(body.q, parsePrintLang(typeof body.lang === "string" ? body.lang : undefined));
  }
  return Response.json({ ok: true });
}
