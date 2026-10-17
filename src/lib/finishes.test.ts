import assert from "node:assert/strict";
import test from "node:test";
import { cardFinishes } from "./finishes.ts";

test("a card with no recorded printings stays on its rarity", () => {
  assert.deepEqual(
    cardFinishes({ rarity: "Rare Holo" }).map((finish) => finish.id),
    ["holo"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Common", series: "Scarlet & Violet" }).map((finish) => finish.id),
    ["common"],
  );
});

test("reverse holo is added only when that card was printed that way", () => {
  assert.deepEqual(
    cardFinishes({
      rarity: "Common",
      prints: [{ t: "normal" }, { t: "reverse" }],
    }).map((finish) => finish.mark),
    ["C", "RH"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Rare", prints: [{ t: "holo" }] }).map((finish) => finish.mark),
    ["H"],
  );
});

test("151 Bulbasaur has the stamp and cosmos reverse that Wartortle does not", () => {
  const bulbasaur = cardFinishes({
    rarity: "Common",
    setName: "Scarlet & Violet 151",
    prints: [
      { t: "normal" },
      { t: "reverse" },
      { t: "normal", s: ["set-logo"] },
      { t: "reverse", f: "cosmos" },
    ],
  });
  assert.deepEqual(
    bulbasaur.map((finish) => finish.en),
    ["Common", "Reverse Holo", "Scarlet & Violet 151 Stamp", "Cosmos Reverse Holo"],
  );
  assert.deepEqual(
    cardFinishes({
      rarity: "Uncommon",
      prints: [{ t: "normal" }, { t: "reverse" }],
    }).map((finish) => finish.en),
    ["Uncommon", "Reverse Holo"],
  );
});

test("Charizard ex and illustration rares stay a single holo printing", () => {
  assert.deepEqual(
    cardFinishes({ rarity: "Double Rare", prints: [{ t: "holo" }] }).map((finish) => finish.mark),
    ["RR"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Illustration Rare", prints: [{ t: "holo" }] }).map((finish) => finish.id),
    ["illustration"],
  );
});

test("Japanese 151 commons use ball-pattern reverses", () => {
  assert.deepEqual(
    cardFinishes({
      rarity: "Common",
      prints: [{ t: "normal" }, { t: "reverse", f: "pokeball" }, { t: "reverse", f: "masterball" }],
    }).map((finish) => finish.en),
    ["Common", "Poké Ball Reverse Holo", "Master Ball Reverse Holo"],
  );
});

test("unknown rarity has no invented finish", () => {
  assert.deepEqual(cardFinishes({ rarity: "Unknown" }), []);
});
