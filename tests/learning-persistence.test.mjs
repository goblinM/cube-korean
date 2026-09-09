import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { createLessonSession, submitLessonAnswer } from "../app/features/lessons/session.ts";
import {
  clearLearningCheckpoint,
  LEARNING_CHECKPOINT_STORAGE_KEY,
  readLearningCheckpoint,
  writeLearningCheckpoint,
} from "../app/features/progress/learning-checkpoint.ts";
import {
  DEFAULT_LEARNING_PREFERENCES,
  LEARNING_PREFERENCES_STORAGE_KEY,
  readLearningPreferences,
  writeLearningPreferences,
} from "../app/features/progress/learning-preferences.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("round-trips learning preferences and falls back from corrupt data", () => {
  const storage = memoryStorage();
  writeLearningPreferences(storage, { showEnglish: false, nativeKeyboard: false, muted: true });
  assert.deepEqual(readLearningPreferences(storage), { version: 1, showEnglish: false, nativeKeyboard: false, muted: true });
  assert.deepEqual(readLearningPreferences(memoryStorage({ [LEARNING_PREFERENCES_STORAGE_KEY]: "{" })), DEFAULT_LEARNING_PREFERENCES);
});

test("restores an unfinished lesson at its current phase and position", () => {
  const lesson = dailyFoodChapter.lessons[0];
  let session = createLessonSession(lesson.words.map((word) => word.id));
  session = submitLessonAnswer(session, lesson.words[0].id, true);
  const storage = memoryStorage();
  writeLearningCheckpoint(storage, {
    practiceMode: "lesson",
    selectedChapterId: dailyFoodChapter.id,
    selectedLessonId: lesson.id,
    reviewWordIds: [],
    session,
  });
  assert.equal(readLearningCheckpoint(storage, [dailyFoodChapter])?.session.position, 1);
  clearLearningCheckpoint(storage);
  assert.equal(storage.getItem(LEARNING_CHECKPOINT_STORAGE_KEY), null);
});

test("rejects a checkpoint whose queue no longer belongs to the selected lesson", () => {
  const lesson = dailyFoodChapter.lessons[0];
  const invalid = {
    version: 1,
    practiceMode: "lesson",
    selectedChapterId: dailyFoodChapter.id,
    selectedLessonId: lesson.id,
    reviewWordIds: [],
    session: { ...createLessonSession([lesson.words[0].id]), queue: [dailyFoodChapter.lessons[1].words[0].id] },
  };
  assert.equal(readLearningCheckpoint(memoryStorage({ [LEARNING_CHECKPOINT_STORAGE_KEY]: JSON.stringify(invalid) }), [dailyFoodChapter]), null);
});
