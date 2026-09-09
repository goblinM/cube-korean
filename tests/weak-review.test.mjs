import assert from "node:assert/strict";
import test from "node:test";
import { COURSE_WORDS } from "../app/data/lessons/course.ts";
import { selectWeakWordIds } from "../app/features/lessons/weak-review.ts";
import { createEmptyProgress } from "../app/features/progress/local-progress.ts";

function mistake(lessonId, errorCount, correctReviews, lastMistakeAt) {
  return { lessonId, errorCount, correctReviews, lastMistakeAt };
}

test("selects only current-course mistakes and limits the smart review queue", () => {
  const progress = createEmptyProgress();
  const [first, second, third] = COURSE_WORDS;
  progress.mistakes[first.word.id] = mistake(first.lessonId, 1, 0, "2026-09-07T00:00:00.000Z");
  progress.mistakes[second.word.id] = mistake(second.lessonId, 3, 1, "2026-09-08T00:00:00.000Z");
  progress.mistakes[third.word.id] = mistake(third.lessonId, 2, 0, "2026-09-09T00:00:00.000Z");
  progress.mistakes.removed = mistake("removed-lesson", 99, 0, "2026-09-09T00:00:00.000Z");
  assert.deepEqual(selectWeakWordIds(COURSE_WORDS, progress, 2), [second.word.id, third.word.id]);
});

test("uses review progress, lesson mastery, and recency as deterministic tie breakers", () => {
  const progress = createEmptyProgress();
  const [first, second, third] = COURSE_WORDS;
  for (const entry of [first, second, third]) {
    progress.mistakes[entry.word.id] = mistake(entry.lessonId, 2, 0, "2026-09-07T00:00:00.000Z");
  }
  progress.mistakes[first.word.id].correctReviews = 1;
  progress.lessons[second.lessonId] = { attempts: 1, bestAccuracy: 96, lastAccuracy: 96, mistakeIds: [], completedAt: "2026-09-07T00:00:00.000Z", mastery: "mastered" };
  progress.mistakes[third.word.id].lastMistakeAt = "2026-09-09T00:00:00.000Z";
  assert.deepEqual(selectWeakWordIds(COURSE_WORDS, progress, 3), [third.word.id, second.word.id, first.word.id]);
});

test("returns an empty queue when no mistakes are available", () => {
  assert.deepEqual(selectWeakWordIds(COURSE_WORDS, createEmptyProgress()), []);
});
