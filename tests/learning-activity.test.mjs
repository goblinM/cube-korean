import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyLearningActivity,
  DAILY_GOAL_STORAGE_KEY,
  localDateKey,
  readDailyGoal,
  readLearningActivity,
  recordLearningActivity,
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

test("records completed learning sessions by local calendar day", () => {
  const storage = memoryStorage();
  const date = new Date(2026, 8, 9, 10, 0, 0);
  recordLearningActivity(storage, 20, 80, date);
  const activity = recordLearningActivity(storage, 5, 100, date);
  assert.deepEqual(activity.days[localDateKey(date)], { sessions: 2, words: 25, accuracyTotal: 180 });
  assert.deepEqual(readLearningActivity(storage), activity);
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

test("accepts only daily goals from one to five", () => {
  const storage = memoryStorage({ [DAILY_GOAL_STORAGE_KEY]: "3" });
  assert.equal(readDailyGoal(storage), 3);
  writeDailyGoal(storage, 5);
  assert.equal(readDailyGoal(storage), 5);
  writeDailyGoal(storage, 8);
  assert.equal(readDailyGoal(storage), 5);
});
