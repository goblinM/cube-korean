import assert from "node:assert/strict";
import test from "node:test";
import {
  COFFEE_TIP_MILESTONES,
  dismissFutureCoffeeTips,
  getCoffeeTipMilestone,
  markCoffeeTipShown,
  readCoffeeTipState,
} from "../app/features/progress/coffee-tip.ts";

function progress(count) {
  return { version: 1, mistakes: {}, lessons: Object.fromEntries(Array.from({ length: count }, (_, index) => [`lesson-${index}`, {}])) };
}

function storage() {
  const items = new Map();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };
}

test("coffee tip starts at level three and reaches the seven agreed unique-lesson milestones", () => {
  const empty = { dismissed: false, shownMilestones: [] };
  assert.equal(getCoffeeTipMilestone(progress(1), progress(2), empty), null);
  for (const milestone of COFFEE_TIP_MILESTONES) {
    assert.equal(getCoffeeTipMilestone(progress(milestone - 1), progress(milestone), empty), milestone);
    assert.equal(getCoffeeTipMilestone(progress(milestone), progress(milestone), empty), milestone);
    assert.equal(getCoffeeTipMilestone(progress(milestone), progress(milestone), { dismissed: false, shownMilestones: [milestone] }), null);
  }
  assert.equal(getCoffeeTipMilestone(progress(8), progress(10), empty), null);
});

test("an existing completed level receives only the latest unseen tip on the next lesson result", () => {
  const empty = { dismissed: false, shownMilestones: [] };
  assert.equal(getCoffeeTipMilestone(progress(2), progress(2), empty), null);
  assert.equal(getCoffeeTipMilestone(progress(3), progress(3), empty), 3);
  assert.equal(getCoffeeTipMilestone(progress(30), progress(31), empty), 25);
  assert.equal(getCoffeeTipMilestone(progress(10), progress(10), { dismissed: false, shownMilestones: [10] }), null);
  assert.equal(getCoffeeTipMilestone(progress(2), progress(1), empty), null);
});

test("coffee tip remembers shown milestones and permanent opt-out", () => {
  const store = storage();
  markCoffeeTipShown(store, 10);
  markCoffeeTipShown(store, 10);
  assert.deepEqual(readCoffeeTipState(store).shownMilestones, [10]);
  assert.equal(getCoffeeTipMilestone(progress(9), progress(10), readCoffeeTipState(store)), null);
  dismissFutureCoffeeTips(store);
  assert.equal(getCoffeeTipMilestone(progress(24), progress(25), readCoffeeTipState(store)), null);
});
