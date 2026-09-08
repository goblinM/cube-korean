import { dailyFoodChapter } from "./daily-food.ts";
import { dailyTravelChapter } from "./daily-travel.ts";
import { hotelStayChapter } from "./hotel-stay.ts";
import type { Chapter, LessonWord } from "./types.ts";

export const CHAPTERS: Chapter[] = [dailyFoodChapter, dailyTravelChapter, hotelStayChapter];

export type CourseWord = {
  chapterId: string;
  chapterTitle: string;
  lessonId: string;
  lessonTitle: string;
  word: LessonWord;
};

/** 建立跨大关卡词汇索引，供错词本查找单词来源与启动复习。 */
export const COURSE_WORDS: CourseWord[] = CHAPTERS.flatMap((chapter) =>
  chapter.lessons.flatMap((lesson) => lesson.words.map((word) => ({
    chapterId: chapter.id,
    chapterTitle: chapter.titleChinese,
    lessonId: lesson.id,
    lessonTitle: lesson.titleChinese,
    word,
  }))),
);
