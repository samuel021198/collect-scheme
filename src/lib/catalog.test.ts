import assert from "node:assert/strict";
import test from "node:test";
import {
  filterCards,
  searchCards,
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
];

const good = {
  author: "夜市阿強",
  side: "sell",
  description: "初代噴火龍，卡面乾淨，只限旺角面交。",
  contact: "IG @nightmarket.cards",
  cardId: "base1-4",
};

test("search matches Chinese and English names", () => {
  assert.equal(searchCards(cards, "噴火龍").length, 2);
  assert.equal(searchCards(cards, "charizard obsidian")[0]?.id, "sv3-223");
  assert.equal(searchCards(cards, "").length, 3);
  assert.equal(cardTitle(cards[0].names, "zh"), "噴火龍");
  assert.equal(cardTitle(cards[0].names, "en"), "Charizard");
});

test("type filter keeps trainers on their own chip", () => {
  assert.deepEqual(
    filterCards(cards, "Fire").map((card) => card.id),
    ["base1-4"],
  );
  assert.equal(filterCards(cards, "Trainer")[0]?.id, "sv4pt5-237");
  assert.equal(filterCards(cards, "nope").length, 3);
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
