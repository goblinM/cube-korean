import type { CourseWord } from "../../data/lessons/course.ts";
import type { CourseProgress } from "../progress/local-progress.ts";

const MASTERY_PRIORITY = { learning: 2, familiar: 1, mastered: 0 } as const;

/** 从当前有效错词中选择短时复习队列，优先高频错误、未巩固、低掌握度和最近出错的词。 */
export function selectWeakWordIds(
  courseWords: CourseWord[],
  progress: CourseProgress,
  limit = 10,
): string[] {
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
  return courseWords
    .flatMap((entry, courseIndex) => {
      const mistake = progress.mistakes[entry.word.id];
      if (!mistake) return [];
      const mastery = progress.lessons[entry.lessonId]?.mastery ?? "learning";
      return [{ wordId: entry.word.id, courseIndex, mistake, mastery }];
    })
    .sort((left, right) =>
      right.mistake.errorCount - left.mistake.errorCount
      || left.mistake.correctReviews - right.mistake.correctReviews
      || MASTERY_PRIORITY[right.mastery] - MASTERY_PRIORITY[left.mastery]
      || Date.parse(right.mistake.lastMistakeAt) - Date.parse(left.mistake.lastMistakeAt)
      || left.courseIndex - right.courseIndex)
    .slice(0, safeLimit)
    .map((entry) => entry.wordId);
}
