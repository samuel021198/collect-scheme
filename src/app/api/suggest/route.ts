import { cardTitle, printForLocale, searchNamedCards } from "@/lib/catalog";
import { loadCards } from "@/lib/content";
import { loadSets, matchSets, seriesLabel } from "@/lib/sets";
import { pickSuggestedCards, previewSetCards } from "@/lib/suggest";

export function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale") === "zh" ? "zh" : "en";
  const lang = printForLocale(locale);
  const cards = loadCards();
  const sets = loadSets();
  const named = searchNamedCards(cards, q, lang).slice(0, 6);
  const setHits = matchSets(sets, q, lang).slice(0, 4);
  const setIds = new Set(setHits.map((set) => set.id));
  const fromSets = setIds.size === 0 ? [] : previewSetCards(cards.filter((card) => setIds.has(card.setId)), 6);
  const cardHits = pickSuggestedCards(named, fromSets, q).map((card) => ({
    id: card.id,
    title: cardTitle(card.names, locale),
    subtitle: "",
    setName: card.setName,
    number: card.number,
    image: card.imageSmall,
    region: card.region === "jp" ? "jp" : "intl",
  }));
  const setPayload = setHits.map((set) => ({
    id: set.id,
    name: set.name,
    code: set.code,
    series: seriesLabel(set.series, locale),
    region: set.region === "jp" ? "jp" : "intl",
  }));
  return Response.json({ cards: cardHits, sets: setPayload });
}
