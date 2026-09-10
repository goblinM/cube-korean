import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { countDueLessons, findChapterContinueLessonId, recommendLesson } from "../app/features/lessons/recommendation.ts";
import { createEmptyProgress, recordLessonResult } from "../app/features/progress/local-progress.ts";

const chapters = [dailyFoodChapter];
const firstLesson = dailyFoodChapter.lessons[0];
const secondLesson = dailyFoodChapter.lessons[1];

test("recommends the first unlocked unfinished lesson for a new learner", () => {
  assert.deepEqual(recommendLesson(chapters, createEmptyProgress()), {
    chapterId: dailyFoodChapter.id,
    lessonId: firstLesson.id,
    reason: "next",
  });
});

test("prioritizes an overdue review before the next unlocked lesson", () => {
  const progress = recordLessonResult(createEmptyProgress(), firstLesson.id, 90, [], "2026-09-01T00:00:00.000Z");
  assert.equal(countDueLessons(progress, new Date("2026-09-09T00:00:00.000Z")), 1);
  assert.deepEqual(recommendLesson(chapters, progress, new Date("2026-09-09T00:00:00.000Z")), {
    chapterId: dailyFoodChapter.id,
    lessonId: firstLesson.id,
    reason: "review",
  });
});

test("moves to the next lesson when completed work is not due", () => {
  const progress = recordLessonResult(createEmptyProgress(), firstLesson.id, 90, [], "2026-09-08T00:00:00.000Z");
  assert.equal(countDueLessons(progress, new Date("2026-09-09T00:00:00.000Z")), 0);
  assert.equal(recommendLesson(chapters, progress, new Date("2026-09-09T00:00:00.000Z")).lessonId, secondLesson.id);
});

test("selects the next unfinished lesson when returning to a chapter", () => {
  const progress = recordLessonResult(createEmptyProgress(), firstLesson.id, 90, []);
  assert.equal(findChapterContinueLessonId(dailyFoodChapter, progress), secondLesson.id);
});

test("selects the last lesson when a chapter is fully complete", () => {
  const progress = dailyFoodChapter.lessons.reduce(
    (current, lesson) => recordLessonResult(current, lesson.id, 90, []),
    createEmptyProgress(),
  );
  assert.equal(findChapterContinueLessonId(dailyFoodChapter, progress), dailyFoodChapter.lessons.at(-1).id);
});
