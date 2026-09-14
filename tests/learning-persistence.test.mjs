import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { createLessonSession, hasNextLessonGroup, submitLessonAnswer } from "../app/features/lessons/session.ts";
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
  writeLearningPreferences(storage, { showEnglish: false, nativeKeyboard: false, muted: true, autoConfirm: false });
  assert.deepEqual(readLearningPreferences(storage), { version: 1, showEnglish: false, nativeKeyboard: false, muted: true, autoConfirm: false });
  assert.deepEqual(readLearningPreferences(memoryStorage({ [LEARNING_PREFERENCES_STORAGE_KEY]: "{" })), DEFAULT_LEARNING_PREFERENCES);
});

test("enables page-keyboard auto confirmation when migrating old preferences", () => {
  const legacy = memoryStorage({
    [LEARNING_PREFERENCES_STORAGE_KEY]: JSON.stringify({ version: 1, showEnglish: false, nativeKeyboard: false, muted: true }),
  });
  assert.deepEqual(readLearningPreferences(legacy), { version: 1, showEnglish: false, nativeKeyboard: false, muted: true, autoConfirm: true });
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

test("restores direct-dictation group replay without expanding it to the full level", () => {
  const lesson = dailyFoodChapter.lessons[0];
  const wordIds = lesson.words.map((word) => word.id);
  const session = createLessonSession(wordIds, { startPhase: "listen", replayGroupIndex: 1 });
  const storage = memoryStorage();
  writeLearningCheckpoint(storage, {
    practiceMode: "lesson", selectedChapterId: dailyFoodChapter.id, selectedLessonId: lesson.id, reviewWordIds: [], session,
  });
  const restored = readLearningCheckpoint(storage, [dailyFoodChapter])?.session;
  assert.equal(restored?.phase, "listen");
  assert.equal(restored?.groupOnly, true);
  assert.equal(restored?.groupIndex, 1);
  assert.deepEqual(restored?.queue, wordIds.slice(5, 10));
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

test("restores checkpoints saved before per-word error counts were introduced", () => {
  const lesson = dailyFoodChapter.lessons[0];
  const session = createLessonSession([lesson.words[0].id]);
  delete session.currentErrorCount;
  delete session.allWordIds;
  delete session.groupIndex;
  delete session.groupSize;
  delete session.completedFirstListenCorrect;
  delete session.completedMistakeIds;
  session.currentHadError = true;
  const legacy = {
    version: 1,
    practiceMode: "lesson",
    selectedChapterId: dailyFoodChapter.id,
    selectedLessonId: lesson.id,
    reviewWordIds: [],
    session,
  };
  assert.equal(readLearningCheckpoint(memoryStorage({ [LEARNING_CHECKPOINT_STORAGE_KEY]: JSON.stringify(legacy) }), [dailyFoodChapter])?.session.currentErrorCount, 0);
  assert.equal(readLearningCheckpoint(memoryStorage({ [LEARNING_CHECKPOINT_STORAGE_KEY]: JSON.stringify(legacy) }), [dailyFoodChapter])?.session.groupSize, null);
});

test("restores the pause between two five-word lesson groups", () => {
  const lesson = dailyFoodChapter.lessons[0];
  let session = createLessonSession(lesson.words.map((word) => word.id));
  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  assert.equal(hasNextLessonGroup(session), true);
  const storage = memoryStorage();
  writeLearningCheckpoint(storage, {
    practiceMode: "lesson",
    selectedChapterId: dailyFoodChapter.id,
    selectedLessonId: lesson.id,
    reviewWordIds: [],
    session,
  });
  const restored = readLearningCheckpoint(storage, [dailyFoodChapter]);
  assert.equal(restored?.session.phase, "results");
  assert.equal(hasNextLessonGroup(restored.session), true);
});
