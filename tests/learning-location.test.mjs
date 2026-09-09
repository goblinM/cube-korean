import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import {
  LEARNING_LOCATION_STORAGE_KEY,
  readLearningLocation,
  writeLearningLocation,
} from "../app/features/progress/learning-location.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("round-trips the last valid chapter and lesson", () => {
  const storage = memoryStorage();
  const lesson = dailyFoodChapter.lessons[4];
  writeLearningLocation(storage, dailyFoodChapter.id, lesson.id);
  assert.deepEqual(readLearningLocation(storage, [dailyFoodChapter]), {
    version: 1,
    chapterId: dailyFoodChapter.id,
    lessonId: lesson.id,
  });
});

test("ignores corrupt, removed, or mismatched learning locations", () => {
  assert.equal(readLearningLocation(memoryStorage({ [LEARNING_LOCATION_STORAGE_KEY]: "{" }), [dailyFoodChapter]), null);
  assert.equal(readLearningLocation(memoryStorage({
    [LEARNING_LOCATION_STORAGE_KEY]: JSON.stringify({ version: 1, chapterId: "removed", lessonId: "removed-1" }),
  }), [dailyFoodChapter]), null);
  assert.equal(readLearningLocation(memoryStorage({
    [LEARNING_LOCATION_STORAGE_KEY]: JSON.stringify({ version: 1, chapterId: dailyFoodChapter.id, lessonId: "removed-1" }),
  }), [dailyFoodChapter]), null);
});
