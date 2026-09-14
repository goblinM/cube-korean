import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyLearningActivity,
  DAILY_GOAL_STORAGE_KEY,
  localDateKey,
  readDailyGoal,
  readLearningActivity,
  recordLearningActivity,
  recordStudiedWord,
  summarizeLearningActivity,
  writeDailyGoal,
} from "../app/features/progress/learning-activity.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("counts each practiced word once per local day, independently of lesson completion", () => {
  const storage = memoryStorage();
  const date = new Date(2026, 8, 9, 10, 0, 0);
  recordStudiedWord(storage, "coffee", date);
  recordStudiedWord(storage, "coffee", date);
  recordStudiedWord(storage, "water", date);
  assert.deepEqual(readLearningActivity(storage).days[localDateKey(date)], {
    sessions: 0, words: 2, accuracyTotal: 0, studiedWordIds: ["coffee", "water"],
  });
  recordLearningActivity(storage, 80, date);
  const activity = recordLearningActivity(storage, 100, date);
  assert.deepEqual(activity.days[localDateKey(date)], {
    sessions: 2, words: 2, accuracyTotal: 180, studiedWordIds: ["coffee", "water"],
  });
  assert.deepEqual(readLearningActivity(storage), activity);
});

test("keeps old daily totals while adding newly practiced words and resets deduplication tomorrow", () => {
  const date = new Date(2026, 8, 9, 10, 0, 0);
  const storage = memoryStorage({ "cubekorean.activity.v1": JSON.stringify({
    version: 1, days: { [localDateKey(date)]: { sessions: 1, words: 20, accuracyTotal: 90 } },
  }) });
  const today = recordStudiedWord(storage, "coffee", date);
  assert.equal(today.days[localDateKey(date)].words, 21);
  const tomorrow = new Date(2026, 8, 10, 10, 0, 0);
  assert.equal(recordStudiedWord(storage, "coffee", tomorrow).days[localDateKey(tomorrow)].words, 1);
});

test("calculates a seven-day chart and keeps yesterday's active streak before today's study", () => {
  const today = new Date(2026, 8, 9, 12, 0, 0);
  const activity = createEmptyLearningActivity();
  for (const offset of [3, 2, 1]) {
    const date = new Date(2026, 8, 9 - offset, 12, 0, 0);
    activity.days[localDateKey(date)] = { sessions: 1, words: 20, accuracyTotal: 90 };
  }
  const summary = summarizeLearningActivity(activity, today);
  assert.equal(summary.days.length, 7);
  assert.equal(summary.streak, 3);
  assert.equal(summary.today.sessions, 0);
});

test("a partially practiced day counts toward the learning streak without a completed session", () => {
  const today = new Date(2026, 8, 9, 12, 0, 0);
  const activity = createEmptyLearningActivity();
  activity.days[localDateKey(today)] = { sessions: 0, words: 1, accuracyTotal: 0, studiedWordIds: ["coffee"] };
  assert.equal(summarizeLearningActivity(activity, today).streak, 1);
});

test("accepts only daily goals from one to five", () => {
  const storage = memoryStorage({ [DAILY_GOAL_STORAGE_KEY]: "3" });
  assert.equal(readDailyGoal(storage), 3);
  writeDailyGoal(storage, 5);
  assert.equal(readDailyGoal(storage), 5);
  writeDailyGoal(storage, 8);
  assert.equal(readDailyGoal(storage), 5);
});
