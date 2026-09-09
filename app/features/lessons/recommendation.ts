import type { Chapter } from "../../data/lessons/types.ts";
import type { CourseProgress } from "../progress/local-progress.ts";
import { isReviewDue, isLessonUnlocked } from "../progress/local-progress.ts";

export type LessonRecommendation = {
  chapterId: string;
  lessonId: string;
  reason: "review" | "next" | "complete";
};

/** 统计已经完成且到达复习时间的关卡，供首页生成今日学习提示。 */
export function countDueLessons(progress: CourseProgress, now = new Date()): number {
  return Object.values(progress.lessons).filter((lesson) => isReviewDue(lesson, now)).length;
}

/** 优先推荐最早到期的复习关卡，否则返回课程顺序中的第一个可学习未完成关卡。 */
export function recommendLesson(
  chapters: Chapter[],
  progress: CourseProgress,
  now = new Date(),
): LessonRecommendation {
  const dueLessons = chapters
    .flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson, progress: progress.lessons[lesson.id] })))
    .filter((entry) => entry.progress && isReviewDue(entry.progress, now))
    .sort((left, right) => {
      const leftTime = left.progress?.nextReviewAt ? new Date(left.progress.nextReviewAt).getTime() : 0;
      const rightTime = right.progress?.nextReviewAt ? new Date(right.progress.nextReviewAt).getTime() : 0;
      return leftTime - rightTime;
    });

  if (dueLessons[0]) {
    return { chapterId: dueLessons[0].chapter.id, lessonId: dueLessons[0].lesson.id, reason: "review" };
  }

  for (const chapter of chapters) {
    const lessonIds = chapter.lessons.map((lesson) => lesson.id);
    const lesson = chapter.lessons.find((candidate) =>
      !progress.lessons[candidate.id] && isLessonUnlocked(lessonIds, candidate.id, progress));
    if (lesson) return { chapterId: chapter.id, lessonId: lesson.id, reason: "next" };
  }

  const fallbackChapter = chapters[0];
  return { chapterId: fallbackChapter.id, lessonId: fallbackChapter.lessons[0].id, reason: "complete" };
}
