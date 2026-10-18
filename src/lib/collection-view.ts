import { cardTitle } from "./catalog";
import { listCollection, type CollectionItem } from "./collection";
import { getCard } from "./content";
import { gradeRank, type ConditionType } from "./grades";
import { speciesOf, speciesTitle } from "./species";

export type CollectionRow = CollectionItem & {
  title: string;
  speciesKey: string | null;
  speciesName: string;
  setId: string;
  setName: string;
  setCode: string | null;
  number: string;
  image: string;
};

export async function collectionRows(userId: string, locale: string) {
  const items = await listCollection(userId);
  const rows: CollectionRow[] = [];
  for (const item of items) {
    const card = await getCard(item.cardId);
    const species = card ? speciesOf(card.names.en) : null;
    rows.push({
      ...item,
      title: card ? cardTitle(card.names, locale) : item.cardId,
      speciesKey: species?.key ?? null,
      speciesName: species ? speciesTitle(species.key, locale) : "",
      setId: card?.setId ?? "",
      setName: card?.setName ?? "",
      setCode: card?.setCode ?? null,
      number: card?.number ?? "",
      image: card?.imageSmall ?? "",
    });
  }
  return rows;
}

export function collectionStats(rows: CollectionRow[]) {
  const copies = rows.reduce((sum, row) => sum + row.quantity, 0);
  const raw = rows.filter((row) => row.condition === "raw").reduce((sum, row) => sum + row.quantity, 0);
  return { copies, unique: new Set(rows.map((row) => row.cardId)).size, raw, graded: copies - raw };
}

export function topPokemon(rows: CollectionRow[]) {
  const grouped = new Map<string, { key: string; name: string; quantity: number; image: string }>();
  for (const row of rows) {
    if (!row.speciesKey) continue;
    const current = grouped.get(row.speciesKey) ?? { key: row.speciesKey, name: row.speciesName, quantity: 0, image: row.image };
    current.quantity += row.quantity;
    if (!current.image && row.image) current.image = row.image;
    grouped.set(row.speciesKey, current);
  }
  return [...grouped.values()].sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name));
}

function numberRank(number: string) {
  const parsed = Number((number.split("/")[0] ?? "").replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 9999;
}

export function sortRows(rows: CollectionRow[], sort: "recent" | "set" | "name" | "grade") {
  const copy = [...rows];
  if (sort === "set") {
    copy.sort((a, b) => a.setName.localeCompare(b.setName) || numberRank(a.number) - numberRank(b.number) || a.title.localeCompare(b.title));
  } else if (sort === "name") {
    copy.sort((a, b) => a.title.localeCompare(b.title) || a.setName.localeCompare(b.setName));
  } else if (sort === "grade") {
    copy.sort((a, b) => gradeRank(b.condition, b.grade) - gradeRank(a.condition, a.grade) || a.title.localeCompare(b.title));
  } else {
    copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return copy;
}

export function filterRows(rows: CollectionRow[], condition: ConditionType | "", setId: string) {
  return rows.filter((row) => (condition ? row.condition === condition : true) && (setId ? row.setId === setId : true));
}
