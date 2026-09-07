import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyProgress,
  isLessonUnlocked,
  PROGRESS_STORAGE_KEY,
  readProgress,
  recordLessonResult,
  writeProgress,
} from "../app/features/progress/local-progress.ts";

function memoryStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) { return key === PROGRESS_STORAGE_KEY ? value : null; },
    setItem(key, nextValue) { if (key === PROGRESS_STORAGE_KEY) value = nextValue; },
  };
}

test("records attempts while retaining the best listening accuracy", () => {
  let progress = recordLessonResult(createEmptyProgress(), "cafe", 60, ["coffee"], "2026-09-07T00:00:00.000Z");
  progress = recordLessonResult(progress, "cafe", 40, ["milk"], "2026-09-07T01:00:00.000Z");
  assert.equal(progress.lessons.cafe.attempts, 2);
  assert.equal(progress.lessons.cafe.bestAccuracy, 60);
  assert.equal(progress.lessons.cafe.lastAccuracy, 40);
  assert.deepEqual(progress.lessons.cafe.mistakeIds, ["milk"]);
});

test("unlocks only the first lesson and the lesson after a completion", () => {
  const ids = ["cafe", "breakfast", "dishes"];
  const empty = createEmptyProgress();
  assert.equal(isLessonUnlocked(ids, "cafe", empty), true);
  assert.equal(isLessonUnlocked(ids, "breakfast", empty), false);
  const completed = recordLessonResult(empty, "cafe", 80, []);
  assert.equal(isLessonUnlocked(ids, "breakfast", completed), true);
  assert.equal(isLessonUnlocked(ids, "dishes", completed), false);
});

test("round-trips valid storage and recovers from corrupt data", () => {
  const storage = memoryStorage();
  const expected = recordLessonResult(createEmptyProgress(), "cafe", 100, []);
  writeProgress(storage, expected);
  assert.deepEqual(readProgress(storage), expected);
  assert.deepEqual(readProgress(memoryStorage("not-json")), createEmptyProgress());
  assert.deepEqual(readProgress(memoryStorage('{"version":2,"lessons":{}}')), createEmptyProgress());
});
