import assert from "node:assert/strict";
import test from "node:test";
import { displayName, hashPassword, normalizeEmail, safeNext, validPassword, verifyPassword } from "./password.ts";

test("password hash matches only the same password", async () => {
  const stored = await hashPassword("binder-pass");
  assert.equal(await verifyPassword("binder-pass", stored), true);
  assert.equal(await verifyPassword("binder-pass!", stored), false);
  assert.equal(await verifyPassword("binder-pass", "nope"), false);
});

test("account fields reject blank email and short passwords", () => {
  assert.equal(normalizeEmail("  Sam@Example.com "), "sam@example.com");
  assert.equal(normalizeEmail("not-an-email"), null);
  assert.equal(validPassword("short"), false);
  assert.equal(validPassword("long-enough"), true);
  assert.equal(displayName("  卡冊  ", "sam@example.com"), "卡冊");
  assert.equal(displayName("", "sam@example.com"), "sam");
  assert.equal(safeNext("https://evil.example"), "/binders");
  assert.equal(safeNext("/encyclopedia/4927"), "/encyclopedia/4927");
});
