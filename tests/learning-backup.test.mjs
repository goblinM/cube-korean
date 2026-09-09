import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import {
  clearAllLearningData,
  createLearningBackup,
  restoreLearningBackup,
} from "../app/features/progress/learning-backup.ts";
import { LEARNING_CHECKPOINT_STORAGE_KEY } from "../app/features/progress/learning-checkpoint.ts";
import { LEARNING_LOCATION_STORAGE_KEY } from "../app/features/progress/learning-location.ts";
import { LEARNING_PREFERENCES_STORAGE_KEY } from "../app/features/progress/learning-preferences.ts";
import { PROGRESS_STORAGE_KEY, createEmptyProgress, recordLessonResult } from "../app/features/progress/local-progress.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("exports and restores validated progress, preferences, and location", () => {
  const lesson = dailyFoodChapter.lessons[0];
  const progress = recordLessonResult(createEmptyProgress(), lesson.id, 90, [], "2026-09-08T00:00:00.000Z");
  const source = memoryStorage({
    [PROGRESS_STORAGE_KEY]: JSON.stringify(progress),
    [LEARNING_PREFERENCES_STORAGE_KEY]: JSON.stringify({ version: 1, showEnglish: false, nativeKeyboard: false, muted: true }),
    [LEARNING_LOCATION_STORAGE_KEY]: JSON.stringify({ version: 1, chapterId: dailyFoodChapter.id, lessonId: lesson.id }),
  });
  const raw = createLearningBackup(source, [dailyFoodChapter], "2026-09-09T00:00:00.000Z");
  const target = memoryStorage({ [LEARNING_CHECKPOINT_STORAGE_KEY]: "stale" });
  const restored = restoreLearningBackup(target, [dailyFoodChapter], raw);
  assert.equal(restored.progress.lessons[lesson.id].bestAccuracy, 90);
  assert.equal(JSON.parse(target.getItem(LEARNING_PREFERENCES_STORAGE_KEY)).muted, true);
  assert.equal(target.getItem(LEARNING_CHECKPOINT_STORAGE_KEY), null);
});

test("rejects invalid or foreign-course backups without overwriting current data", () => {
  const target = memoryStorage({ [PROGRESS_STORAGE_KEY]: "current" });
  const invalid = JSON.stringify({
    version: 1,
    exportedAt: "2026-09-09T00:00:00.000Z",
    progress: { version: 1, lessons: { "foreign-1": {} }, mistakes: {} },
    preferences: { version: 1, showEnglish: true, nativeKeyboard: true, muted: false },
    location: null,
  });
  assert.throws(() => restoreLearningBackup(target, [dailyFoodChapter], invalid));
  assert.equal(target.getItem(PROGRESS_STORAGE_KEY), "current");
});

test("clears every device-local learning record", () => {
  const storage = memoryStorage({
    [PROGRESS_STORAGE_KEY]: "progress",
    [LEARNING_PREFERENCES_STORAGE_KEY]: "preferences",
    [LEARNING_LOCATION_STORAGE_KEY]: "location",
    [LEARNING_CHECKPOINT_STORAGE_KEY]: "checkpoint",
  });
  clearAllLearningData(storage);
  for (const key of [PROGRESS_STORAGE_KEY, LEARNING_PREFERENCES_STORAGE_KEY, LEARNING_LOCATION_STORAGE_KEY, LEARNING_CHECKPOINT_STORAGE_KEY]) {
    assert.equal(storage.getItem(key), null);
  }
});
