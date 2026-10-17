const TYPES: Record<string, string> = {
  Colorless: "無色",
  Darkness: "惡",
  Dragon: "龍",
  Fairy: "妖精",
  Fighting: "鬥",
  Fire: "火",
  Grass: "草",
  Lightning: "電",
  Metal: "鋼",
  Psychic: "超",
  Water: "水",
  Trainer: "訓練家",
};

const RARITIES: Record<string, string> = {
  Common: "普通",
  Uncommon: "非普通",
  Rare: "稀有",
  "Rare Holo": "閃卡",
  "Rare Holo EX": "閃卡 EX",
  "Rare Holo V": "閃卡 V",
  "Rare Holo VMAX": "閃卡 VMAX",
  "Rare Holo VSTAR": "閃卡 VSTAR",
  "Rare Ultra": "超稀有",
  "Ultra Rare": "超稀有",
  "Illustration Rare": "插畫稀有",
  "Special Illustration Rare": "特別插畫稀有",
  "Hyper Rare": "極稀有",
  "Double Rare": "雙稀有",
  "Art Rare": "藝術稀有",
  "Special Art Rare": "特別藝術稀有",
  "Super Rare": "超級稀有",
  Promo: "促銷",
  "ACE SPEC Rare": "ACE SPEC 稀有",
  "Rare Rainbow": "彩虹稀有",
  "Trainer Gallery Rare Holo": "訓練家藝廊閃",
};

const SUPERTYPES: Record<string, string> = {
  Pokémon: "寶可夢",
  Trainer: "訓練家",
  Energy: "能量",
};

const SUBTYPES: Record<string, string> = {
  Basic: "基礎",
  "Stage 1": "1階進化",
  "Stage 2": "2階進化",
  Item: "物品",
  Supporter: "支援者",
  Stadium: "競技場",
  Special: "特殊",
  Tera: "太晶",
};

export function textLabel(group: "type" | "rarity" | "supertype" | "subtype", value: string, locale: string) {
  if (locale !== "zh") return value;
  const table =
    group === "type" ? TYPES : group === "rarity" ? RARITIES : group === "supertype" ? SUPERTYPES : SUBTYPES;
  return table[value] ?? value;
}

export const TYPE_DOT: Record<string, string> = {
  Fire: "bg-orange-400",
  Water: "bg-sky-400",
  Grass: "bg-emerald-400",
  Lightning: "bg-yellow-300",
  Psychic: "bg-fuchsia-400",
  Fighting: "bg-rose-500",
  Darkness: "bg-violet-300",
  Metal: "bg-slate-300",
  Dragon: "bg-amber-500",
  Fairy: "bg-pink-300",
  Colorless: "bg-stone-300",
  Trainer: "bg-primary",
};
