import assert from "node:assert/strict";
import test from "node:test";
import { createResilientStorage } from "../app/features/progress/resilient-storage.ts";

test("falls back to in-memory progress when browser storage rejects writes", () => {
  let notices = 0;
  const storage = createResilientStorage(() => ({
    getItem() { return null; },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  }), () => { notices += 1; });

  storage.setItem("progress", "saved for this tab");

  assert.equal(storage.getItem("progress"), "saved for this tab");
  assert.equal(notices, 1);
  assert.doesNotThrow(() => storage.removeItem("progress"));
  assert.equal(storage.getItem("progress"), null);
});

test("mirrors successful persistent reads so an interrupted store keeps known data", () => {
  const values = new Map([["progress", "existing"]]);
  let rejectWrites = false;
  const storage = createResilientStorage(() => ({
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) {
      if (rejectWrites) throw new Error("quota");
      values.set(key, value);
    },
    removeItem(key) { values.delete(key); },
  }), () => {});

  assert.equal(storage.getItem("progress"), "existing");
  rejectWrites = true;
  storage.setItem("progress", "latest");
  assert.equal(storage.getItem("progress"), "latest");
});
