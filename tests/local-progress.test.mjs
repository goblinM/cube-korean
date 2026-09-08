import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyProgress,
  isReviewDue,
  isLessonUnlocked,
  PROGRESS_STORAGE_KEY,
  readProgress,
  recordLessonResult,
  recordMistakeReview,
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
  assert.equal(progress.lessons.cafe.mastery, "learning");
  assert.equal(progress.lessons.cafe.nextReviewAt, "2026-09-08T01:00:00.000Z");
});

test("adds listening errors and removes them after two clean reviews", () => {
  let progress = recordLessonResult(createEmptyProgress(), "cafe", 50, ["coffee"], "2026-09-07T00:00:00.000Z");
  assert.equal(progress.mistakes.coffee.errorCount, 1);
  progress = recordMistakeReview(progress, ["coffee"], [], "2026-09-08T00:00:00.000Z");
  assert.equal(progress.mistakes.coffee.correctReviews, 1);
  progress = recordMistakeReview(progress, ["coffee"], [], "2026-09-09T00:00:00.000Z");
  assert.equal(progress.mistakes.coffee, undefined);
});

test("keeps a word after a failed dedicated review", () => {
  let progress = recordLessonResult(createEmptyProgress(), "cafe", 50, ["coffee"]);
  progress = recordMistakeReview(progress, ["coffee"], ["coffee"], "2026-09-08T00:00:00.000Z");
  assert.equal(progress.mistakes.coffee.errorCount, 2);
  assert.equal(progress.mistakes.coffee.correctReviews, 0);
});

test("advances from familiar to mastered with spaced review dates", () => {
  let progress = recordLessonResult(createEmptyProgress(), "cafe", 100, [], "2026-09-07T00:00:00.000Z");
  assert.equal(progress.lessons.cafe.mastery, "familiar");
  assert.equal(progress.lessons.cafe.nextReviewAt, "2026-09-10T00:00:00.000Z");
  progress = recordLessonResult(progress, "cafe", 100, [], "2026-09-10T00:00:00.000Z");
  assert.equal(progress.lessons.cafe.mastery, "mastered");
  assert.equal(progress.lessons.cafe.nextReviewAt, "2026-09-17T00:00:00.000Z");
  assert.equal(isReviewDue(progress.lessons.cafe, new Date("2026-09-16T23:59:59.000Z")), false);
  assert.equal(isReviewDue(progress.lessons.cafe, new Date("2026-09-17T00:00:00.000Z")), true);
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
