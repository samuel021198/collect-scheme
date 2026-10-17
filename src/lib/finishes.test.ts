import assert from "node:assert/strict";
import test from "node:test";
import { cardFinishes } from "./finishes.ts";

test("base-set cards stay a single finish", () => {
  assert.deepEqual(
    cardFinishes({ rarity: "Rare Holo", series: "Original" }).map((finish) => finish.id),
    ["holo"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Common", series: "Original" }).map((finish) => finish.id),
    ["common"],
  );
});

test("modern commons also come as reverse holos", () => {
  assert.deepEqual(
    cardFinishes({ rarity: "Common", series: "Scarlet & Violet" }).map((finish) => finish.id),
    ["common", "reverse"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Rare Holo", series: "Sword & Shield" }).map((finish) => finish.mark),
    ["H", "RH"],
  );
});

test("illustration rares and ex cards do not grow a reverse holo", () => {
  assert.deepEqual(
    cardFinishes({ rarity: "Illustration Rare", series: "Scarlet & Violet" }).map((finish) => finish.id),
    ["illustration"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Double Rare", series: "Scarlet & Violet" }).map((finish) => finish.mark),
    ["RR"],
  );
  assert.deepEqual(
    cardFinishes({ rarity: "Art Rare", series: "Scarlet & Violet" }).map((finish) => finish.mark),
    ["AR"],
  );
});

test("Legendary Collection is the reverse-holo printing", () => {
  assert.deepEqual(
    cardFinishes({ rarity: "Common", series: "Legendary Collection" }).map((finish) => finish.id),
    ["reverse"],
  );
});

test("unknown rarity has no invented finish", () => {
  assert.deepEqual(cardFinishes({ rarity: "Unknown", series: "Scarlet & Violet" }), []);
});
