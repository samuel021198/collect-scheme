import assert from "node:assert/strict";
import test from "node:test";
import {
  filterCards,
  searchNamedCards,
  shouldQueryLive,
  validatePost,
  validateReply,
  cardTitle,
} from "./catalog.ts";
import type { CatalogCard } from "./types.ts";

const cards: CatalogCard[] = [
  {
    id: "base1-4",
    names: { en: "Charizard", zh: "噴火龍" },
    supertype: "Pokémon",
    subtypes: ["Stage 2"],
    hp: "120",
    types: ["Fire"],
    setId: "base1",
    setName: "Base",
    number: "4",
    rarity: "Rare Holo",
    imageSmall: "https://images.pokemontcg.io/base1/4.png",
    imageLarge: "https://images.pokemontcg.io/base1/4_hires.png",
  },
  {
    id: "sv3-223",
    names: { en: "Charizard ex", zh: "噴火龍ex" },
    supertype: "Pokémon",
    subtypes: ["Stage 2", "ex"],
    hp: "330",
    types: ["Darkness"],
    setId: "sv3",
    setName: "Obsidian Flames",
    number: "223",
    rarity: "Special Illustration Rare",
    imageSmall: "https://images.pokemontcg.io/sv3/223.png",
    imageLarge: "https://images.pokemontcg.io/sv3/223_hires.png",
  },
  {
    id: "sv4pt5-237",
    names: { en: "Iono", zh: "奇樹" },
    supertype: "Trainer",
    subtypes: ["Supporter"],
    hp: null,
    types: [],
    setId: "sv4pt5",
    setName: "Paldean Fates",
    number: "237",
    rarity: "Special Illustration Rare",
    imageSmall: "https://images.pokemontcg.io/sv4pt5/237.png",
    imageLarge: "https://images.pokemontcg.io/sv4pt5/237_hires.png",
  },
  {
    id: "jp-6",
    names: { en: "Charizard ex", zh: "噴火龍 ex" },
    supertype: "Pokémon",
    subtypes: ["Stage 2", "ex"],
    hp: "330",
    types: ["Fire"],
    setId: "11575",
    setName: "Pokémon Card 151",
    setCode: "SV2a",
    region: "jp",
    number: "006/165",
    rarity: "Double Rare",
    imageSmall: "https://static.tcgcollector.com/jp.png",
    imageLarge: "https://static.tcgcollector.com/jp.png",
  },
  {
    id: "mew",
    names: { en: "Mew", zh: "夢幻" },
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "60",
    types: ["Psychic"],
    setId: "base1",
    setName: "Base",
    region: "intl",
    number: "8",
    rarity: "Rare",
    imageSmall: "https://images.pokemontcg.io/base1/8.png",
    imageLarge: "https://images.pokemontcg.io/base1/8.png",
  },
  {
    id: "mewtwo",
    names: { en: "Mewtwo", zh: "超夢" },
    supertype: "Pokémon",
    subtypes: ["Basic"],
    hp: "70",
    types: ["Psychic"],
    setId: "base1",
    setName: "Base",
    region: "intl",
    number: "10",
    rarity: "Rare Holo",
    imageSmall: "https://images.pokemontcg.io/base1/10.png",
    imageLarge: "https://images.pokemontcg.io/base1/10.png",
  },
];

const good = {
  author: "夜市阿強",
  side: "sell",
  description: "初代噴火龍，卡面乾淨，只限旺角面交。",
  contact: "IG @nightmarket.cards",
  cardId: "base1-4",
};

test("search matches Chinese and English names in one print", () => {
  assert.deepEqual(
    searchNamedCards(cards, "噴火龍", "en").map((card) => card.id),
    ["base1-4", "sv3-223"],
  );
  assert.deepEqual(
    searchNamedCards(cards, "噴火龍", "ja").map((card) => card.id),
    ["jp-6"],
  );
  assert.equal(searchNamedCards(cards, "charizard obsidian")[0]?.id, "sv3-223");
  assert.equal(searchNamedCards(cards, "Charizard")[0]?.id, "base1-4");
  assert.equal(searchNamedCards(cards, "").length, 0);
  assert.equal(searchNamedCards(cards, "ex").length, 0);
  assert.equal(searchNamedCards(cards, "火").length, 0);
  assert.equal(searchNamedCards(cards, "SV2A", "ja").length, 0);
  assert.equal(searchNamedCards(cards, "006/165", "ja")[0]?.id, "jp-6");
  assert.deepEqual(
    searchNamedCards(cards, "Mew", "en").map((card) => card.id),
    ["mew"],
  );
  assert.equal(cardTitle(cards[0].names, "zh"), "噴火龍");
  assert.equal(cardTitle(cards[0].names, "en"), "Charizard");
});

test("type filter keeps trainers on their own chip", () => {
  assert.deepEqual(
    filterCards(cards, "Fire").map((card) => card.id),
    ["base1-4", "jp-6"],
  );
  assert.equal(filterCards(cards, "Trainer")[0]?.id, "sv4pt5-237");
  assert.equal(filterCards(cards, "nope").length, 6);
});

test("live search stays off without a key or for Chinese queries", () => {
  assert.equal(shouldQueryLive("pikachu", undefined), false);
  assert.equal(shouldQueryLive("皮", "key"), false);
  assert.equal(shouldQueryLive("pika", "key"), true);
  assert.equal(shouldQueryLive("a", "key"), false);
});

test("trade validation rejects short copy and accepts a real post", () => {
  assert.equal(validatePost(good), null);
  assert.equal(validatePost({ ...good, description: "太短" }), "description");
  assert.equal(validatePost({ ...good, author: "x" }), "nick");
  assert.equal(validatePost({ ...good, side: "trade" }), "side");
  assert.equal(validatePost({ ...good, cardId: "../etc" }), "card");
  assert.equal(validateReply({ author: "May_01", body: "週末可看卡" }), null);
  assert.equal(validateReply({ author: "May_01", body: "  " }), "body");
});
