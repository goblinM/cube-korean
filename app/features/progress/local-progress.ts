export const PROGRESS_STORAGE_KEY = "cubekorean.progress.v1";

export type LessonProgress = {
  attempts: number;
  bestAccuracy: number;
  lastAccuracy: number;
  mistakeIds: string[];
  completedAt: string;
  mastery?: "learning" | "familiar" | "mastered";
  nextReviewAt?: string;
};

export type WordMistakeProgress = {
  lessonId: string;
  errorCount: number;
  correctReviews: number;
  lastMistakeAt: string;
};

export type CourseProgress = {
  version: 1;
  lessons: Record<string, LessonProgress>;
  mistakes: Record<string, WordMistakeProgress>;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isValidAccuracy(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

/** 深度校验导入或本机读取的进度结构，防止损坏字段进入学习流程。 */
export function isCourseProgress(value: unknown): value is CourseProgress {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CourseProgress>;
  if (candidate.version !== 1 || !candidate.lessons || typeof candidate.lessons !== "object" || !candidate.mistakes || typeof candidate.mistakes !== "object") return false;
  const lessonsValid = Object.values(candidate.lessons).every((lesson) =>
    lesson
    && Number.isInteger(lesson.attempts) && lesson.attempts >= 0
    && isValidAccuracy(lesson.bestAccuracy)
    && isValidAccuracy(lesson.lastAccuracy)
    && Array.isArray(lesson.mistakeIds) && lesson.mistakeIds.every((id) => typeof id === "string")
    && isValidDate(lesson.completedAt)
    && (lesson.mastery === undefined || ["learning", "familiar", "mastered"].includes(lesson.mastery))
    && (lesson.nextReviewAt === undefined || isValidDate(lesson.nextReviewAt)));
  const mistakesValid = Object.values(candidate.mistakes).every((mistake) =>
    mistake
    && typeof mistake.lessonId === "string"
    && Number.isInteger(mistake.errorCount) && mistake.errorCount >= 0
    && Number.isInteger(mistake.correctReviews) && mistake.correctReviews >= 0
    && isValidDate(mistake.lastMistakeAt));
  return lessonsValid && mistakesValid;
}

/** 创建没有历史记录的版本化进度对象，作为首次使用和损坏数据的安全回退。 */
export function createEmptyProgress(): CourseProgress {
  return { version: 1, lessons: {}, mistakes: {} };
}

/** 从浏览器存储读取并验证进度外形，格式不兼容或解析失败时返回空进度。 */
export function readProgress(storage: StorageReader): CourseProgress {
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as Partial<CourseProgress>;
    if (parsed.version === 1 && parsed.lessons && typeof parsed.lessons === "object" && !parsed.mistakes) {
      parsed.mistakes = {};
    }
    if (!isCourseProgress(parsed)) {
      return createEmptyProgress();
    }
    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

/** 合并一次通关结果并保留历史最高正确率，为关卡解锁和结果展示提供本机状态。 */
export function recordLessonResult(
  progress: CourseProgress,
  lessonId: string,
  accuracy: number,
  mistakeIds: string[],
  completedAt = new Date().toISOString(),
): CourseProgress {
  const previous = progress.lessons[lessonId];
  const mastery = accuracy >= 95 && (previous?.bestAccuracy ?? 0) >= 95
    ? "mastered"
    : accuracy >= 80 ? "familiar" : "learning";
  const reviewDays = mastery === "mastered" ? 7 : mastery === "familiar" ? 3 : 1;
  const nextReviewAt = new Date(new Date(completedAt).getTime() + reviewDays * 86_400_000).toISOString();
  const mistakes = { ...progress.mistakes };
  for (const wordId of mistakeIds) {
    const previousMistake = mistakes[wordId];
    mistakes[wordId] = {
      lessonId,
      errorCount: (previousMistake?.errorCount ?? 0) + 1,
      correctReviews: 0,
      lastMistakeAt: completedAt,
    };
  }
  return {
    version: 1,
    mistakes,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        attempts: (previous?.attempts ?? 0) + 1,
        bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
        lastAccuracy: accuracy,
        mistakeIds: [...mistakeIds],
        completedAt,
        mastery,
        nextReviewAt,
      },
    },
  };
}

/** 合并一次专项错词复习；连续两轮一次答对后移出错词本，答错则重置掌握进度。 */
export function recordMistakeReview(
  progress: CourseProgress,
  reviewedWordIds: string[],
  failedWordIds: string[],
  reviewedAt = new Date().toISOString(),
): CourseProgress {
  const failed = new Set(failedWordIds);
  const mistakes = { ...progress.mistakes };

  for (const wordId of reviewedWordIds) {
    const previous = mistakes[wordId];
    if (!previous) continue;
    if (failed.has(wordId)) {
      mistakes[wordId] = { ...previous, errorCount: previous.errorCount + 1, correctReviews: 0, lastMistakeAt: reviewedAt };
    } else if (previous.correctReviews + 1 >= 2) {
      delete mistakes[wordId];
    } else {
      mistakes[wordId] = { ...previous, correctReviews: previous.correctReviews + 1 };
    }
  }

  return { ...progress, mistakes };
}

/** 判断已学关卡是否到达下一次复习时间；旧进度没有计划时视为待复习。 */
export function isReviewDue(progress: LessonProgress, now = new Date()): boolean {
  return !progress.nextReviewAt || new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

/** 将完整版本化进度写入指定浏览器存储，避免页面组件散落序列化细节。 */
export function writeProgress(storage: StorageWriter, progress: CourseProgress): void {
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

/** 根据前一关是否完成判断目标小关卡能否进入，第一关始终开放。 */
export function isLessonUnlocked(
  lessonIds: string[],
  lessonId: string,
  progress: CourseProgress,
): boolean {
  const index = lessonIds.indexOf(lessonId);
  if (index <= 0) return index === 0;
  return Boolean(progress.lessons[lessonIds[index - 1]]);
}
