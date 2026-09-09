import type { Chapter } from "../../data/lessons/types.ts";
import type { CourseProgress, LessonProgress } from "./local-progress.ts";

export type ChapterLearningStats = {
  chapterId: string;
  titleChinese: string;
  titleKorean: string;
  completedLessons: number;
  totalLessons: number;
  completedWords: number;
  percent: number;
};

export type RecentLearningRecord = {
  chapterTitle: string;
  lessonTitle: string;
  completedAt: string;
  accuracy: number;
  mastery: NonNullable<LessonProgress["mastery"]>;
};

export type LearningStats = {
  completedLessons: number;
  learnedWords: number;
  totalAttempts: number;
  averageAccuracy: number;
  mastery: { learning: number; familiar: number; mastered: number };
  chapters: ChapterLearningStats[];
  recent: RecentLearningRecord[];
};

/** 根据当前课程和本机进度计算可验证的学习统计，不推断尚未记录的历史趋势。 */
export function calculateLearningStats(chapters: Chapter[], progress: CourseProgress): LearningStats {
  const knownLessons = chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ chapter, lesson })));
  const completed = knownLessons.flatMap(({ chapter, lesson }) => {
    const lessonProgress = progress.lessons[lesson.id];
    return lessonProgress ? [{ chapter, lesson, progress: lessonProgress }] : [];
  });
  const mastery = { learning: 0, familiar: 0, mastered: 0 };
  for (const entry of completed) mastery[entry.progress.mastery ?? "learning"] += 1;

  const chaptersStats = chapters.map((chapter) => {
    const completedLessons = chapter.lessons.filter((lesson) => progress.lessons[lesson.id]).length;
    const completedWords = chapter.lessons.reduce((total, lesson) =>
      total + (progress.lessons[lesson.id] ? lesson.words.length : 0), 0);
    return {
      chapterId: chapter.id,
      titleChinese: chapter.titleChinese,
      titleKorean: chapter.titleKorean,
      completedLessons,
      totalLessons: chapter.lessons.length,
      completedWords,
      percent: chapter.lessons.length ? Math.round((completedLessons / chapter.lessons.length) * 100) : 0,
    };
  });

  return {
    completedLessons: completed.length,
    learnedWords: completed.reduce((total, entry) => total + entry.lesson.words.length, 0),
    totalAttempts: completed.reduce((total, entry) => total + entry.progress.attempts, 0),
    averageAccuracy: completed.length
      ? Math.round(completed.reduce((total, entry) => total + entry.progress.lastAccuracy, 0) / completed.length)
      : 0,
    mastery,
    chapters: chaptersStats,
    recent: completed
      .sort((left, right) => Date.parse(right.progress.completedAt) - Date.parse(left.progress.completedAt))
      .slice(0, 5)
      .map((entry) => ({
        chapterTitle: entry.chapter.titleChinese,
        lessonTitle: entry.lesson.titleChinese,
        completedAt: entry.progress.completedAt,
        accuracy: entry.progress.lastAccuracy,
        mastery: entry.progress.mastery ?? "learning",
      })),
  };
}
