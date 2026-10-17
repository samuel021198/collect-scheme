import { queryCards } from "@/lib/content";

export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const cards = queryCards(q).slice(0, 24);
  return Response.json({ cards });
}
