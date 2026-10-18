import assert from "node:assert/strict";
import test from "node:test";
import { cleanBinderName, packSlots } from "./binder-rules.ts";
import { cleanCondition, gradesFor, quantityLeft } from "./grades.ts";
import { speciesOf } from "./species.ts";

test("grader scales follow each company", () => {
  assert.equal(gradesFor("psa").includes("9.5"), false);
  assert.equal(gradesFor("psa").includes("10"), true);
  assert.equal(gradesFor("bgs").includes("9.5"), true);
  assert.equal(gradesFor("bgs").at(-1), "10");
  assert.equal(gradesFor("cgc").includes("9.5"), true);
  assert.equal(gradesFor("cgc").includes("10"), true);
  assert.equal(gradesFor("cgc").includes("pristine_10"), true);
  assert.equal(gradesFor("tag").includes("8.5"), true);
  assert.equal(gradesFor("tag").includes("9.5"), false);
  assert.equal(gradesFor("tag").includes("10"), true);
  assert.deepEqual(cleanCondition("raw", "10"), { condition: "raw", grade: "" });
  assert.equal(cleanCondition("psa", "9.5"), null);
  assert.deepEqual(cleanCondition("bgs", "9.5"), { condition: "bgs", grade: "9.5" });
  assert.deepEqual(cleanCondition("cgc", "pristine_10"), { condition: "cgc", grade: "pristine_10" });
  assert.equal(cleanCondition("tag", "9.5"), null);
  assert.equal(quantityLeft(2, 1), 1);
  assert.equal(quantityLeft(2, 2), 0);
  assert.equal(quantityLeft(2, 3), null);
  assert.equal(quantityLeft(2, 0), null);
});

test("species groups printings of the same Pokémon", () => {
  assert.equal(speciesOf("Charizard ex")?.key, "Charizard");
  assert.equal(speciesOf("Ditto (Crown Zenith GG22/GG70)")?.key, "Ditto");
  assert.equal(speciesOf("Mewtwo")?.key, "Mewtwo");
  assert.equal(speciesOf("Iono"), null);
  assert.equal(speciesOf("Charizard")?.zh, "噴火龍");
});

test("a layout change keeps cards in reading order", () => {
  assert.deepEqual(packSlots(2, "4x4"), [
    { page: 0, row: 0, col: 0 },
    { page: 0, row: 0, col: 1 },
  ]);
  assert.equal(packSlots(10, "3x3")[9]?.page, 1);
  assert.equal(cleanBinderName("  主系列  "), "主系列");
  assert.equal(cleanBinderName(""), null);
});
