import type { Chapter, LessonWord } from "./types";

export type CourseValidationOptions = {
  lessonsPerChapter?: number;
  wordsPerLesson?: number;
};

/** 校验课程标识、必填文本和重复词，并可检查规划中的关卡及词数是否达到要求。 */
export function validateChapter(
  chapter: Chapter,
  options: CourseValidationOptions = {},
): string[] {
  const issues: string[] = [];
  const lessonIds = new Set<string>();
  const wordIds = new Set<string>();

  if (!chapter.id || !chapter.titleChinese || !chapter.titleKorean) {
    issues.push("大关卡缺少标识、中文标题或韩文标题");
  }
  if (options.lessonsPerChapter && chapter.lessons.length !== options.lessonsPerChapter) {
    issues.push(`大关卡应包含 ${options.lessonsPerChapter} 个小关卡，当前为 ${chapter.lessons.length} 个`);
  }

  for (const lesson of chapter.lessons) {
    if (lessonIds.has(lesson.id)) issues.push(`小关卡标识重复：${lesson.id}`);
    lessonIds.add(lesson.id);
    if (!lesson.id || !lesson.titleChinese || !lesson.titleKorean) {
      issues.push("小关卡缺少标识、中文标题或韩文标题");
    }
    if (options.wordsPerLesson && lesson.words.length !== options.wordsPerLesson) {
      issues.push(`${lesson.id} 应包含 ${options.wordsPerLesson} 个词，当前为 ${lesson.words.length} 个`);
    }
    for (const word of lesson.words) validateWord(word, wordIds, issues);
  }

  return issues;
}

/** 检查单词必填字段及全章唯一标识，防止缺失释义或重复记录进入练习流程。 */
function validateWord(word: LessonWord, wordIds: Set<string>, issues: string[]): void {
  if (wordIds.has(word.id)) issues.push(`单词标识重复：${word.id}`);
  wordIds.add(word.id);
  if (!word.id || !word.korean || !word.chinese || !word.english || !word.emoji) {
    issues.push(`单词字段不完整：${word.id || "unknown"}`);
  }
}
