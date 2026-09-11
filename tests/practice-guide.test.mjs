import assert from "node:assert/strict";
import test from "node:test";
import {
  markPracticeGuideSeen,
  PRACTICE_GUIDE_STORAGE_KEY,
  shouldShowPracticeGuide,
} from "../app/features/lessons/practice-guide.ts";

function createStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      assert.equal(key, PRACTICE_GUIDE_STORAGE_KEY);
      return value;
    },
    setItem(key, nextValue) {
      assert.equal(key, PRACTICE_GUIDE_STORAGE_KEY);
      value = nextValue;
    },
  };
}

test("shows the practice guide once on a device", () => {
  const storage = createStorage();
  assert.equal(shouldShowPracticeGuide(storage), true);
  markPracticeGuideSeen(storage);
  assert.equal(shouldShowPracticeGuide(storage), false);
});

test("keeps the guide available when local storage is blocked", () => {
  assert.equal(shouldShowPracticeGuide({ getItem() { throw new Error("blocked"); } }), true);
  assert.doesNotThrow(() => markPracticeGuideSeen({ setItem() { throw new Error("blocked"); } }));
});
