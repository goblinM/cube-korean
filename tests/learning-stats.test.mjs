import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { dailyTravelChapter } from "../app/data/lessons/daily-travel.ts";
import { calculateLearningStats } from "../app/features/progress/learning-stats.ts";
import { createEmptyProgress, recordLessonResult } from "../app/features/progress/local-progress.ts";

const chapters = [dailyFoodChapter, dailyTravelChapter];

test("returns zeroed learning statistics for a new learner", () => {
  const stats = calculateLearningStats(chapters, createEmptyProgress());
  assert.equal(stats.completedLessons, 0);
  assert.equal(stats.learnedWords, 0);
  assert.equal(stats.averageAccuracy, 0);
  assert.deepEqual(stats.mastery, { learning: 0, familiar: 0, mastered: 0 });
  assert.equal(stats.chapters.length, 2);
});

test("calculates attempts, current accuracy, mastery, chapter progress and recent order", () => {
  const first = dailyFoodChapter.lessons[0];
  const second = dailyFoodChapter.lessons[1];
  let progress = recordLessonResult(createEmptyProgress(), first.id, 70, [], "2026-09-07T00:00:00.000Z");
  progress = recordLessonResult(progress, first.id, 96, [], "2026-09-08T00:00:00.000Z");
  progress = recordLessonResult(progress, first.id, 96, [], "2026-09-08T12:00:00.000Z");
  progress = recordLessonResult(progress, second.id, 85, [], "2026-09-09T00:00:00.000Z");
  const stats = calculateLearningStats(chapters, progress);
  assert.equal(stats.completedLessons, 2);
  assert.equal(stats.learnedWords, 40);
  assert.equal(stats.totalAttempts, 4);
  assert.equal(stats.averageAccuracy, 91);
  assert.deepEqual(stats.mastery, { learning: 0, familiar: 1, mastered: 1 });
  assert.deepEqual(stats.chapters.map((chapter) => chapter.percent), [20, 0]);
  assert.equal(stats.recent[0].lessonTitle, second.titleChinese);
});
