import { parsePrintLang } from "@/lib/catalog";
import { queryCards } from "@/lib/content";

export function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const lang = parsePrintLang(url.searchParams.get("lang") ?? undefined);
  const cards = queryCards(q, lang).slice(0, 24);
  return Response.json({ cards });
}
