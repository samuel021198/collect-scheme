import speciesZh from "../../data/names/species-zh.json" with { type: "json" };

const names = speciesZh as Record<string, string>;
const species = Object.keys(names).sort((a, b) => b.length - a.length);
const matchers = species.map((name) => ({
  name,
  pattern: new RegExp(`(?:^|\\s)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`, "i"),
}));

export function speciesOf(englishName: string) {
  const name = englishName.replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const found = matchers.find((item) => item.pattern.test(name));
  if (!found) return null;
  return { key: found.name, zh: names[found.name] ?? found.name };
}

export function speciesTitle(key: string, locale: string) {
  if (locale === "zh" && names[key]) return names[key];
  return key;
}
