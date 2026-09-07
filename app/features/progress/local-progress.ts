export const PROGRESS_STORAGE_KEY = "cubekorean.progress.v1";

export type LessonProgress = {
  attempts: number;
  bestAccuracy: number;
  lastAccuracy: number;
  mistakeIds: string[];
  completedAt: string;
};

export type CourseProgress = {
  version: 1;
  lessons: Record<string, LessonProgress>;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

/** 创建没有历史记录的版本化进度对象，作为首次使用和损坏数据的安全回退。 */
export function createEmptyProgress(): CourseProgress {
  return { version: 1, lessons: {} };
}

/** 从浏览器存储读取并验证进度外形，格式不兼容或解析失败时返回空进度。 */
export function readProgress(storage: StorageReader): CourseProgress {
  try {
    const raw = storage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createEmptyProgress();
    const parsed = JSON.parse(raw) as Partial<CourseProgress>;
    if (parsed.version !== 1 || !parsed.lessons || typeof parsed.lessons !== "object") {
      return createEmptyProgress();
    }
    return parsed as CourseProgress;
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
  return {
    version: 1,
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        attempts: (previous?.attempts ?? 0) + 1,
        bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
        lastAccuracy: accuracy,
        mistakeIds: [...mistakeIds],
        completedAt,
      },
    },
  };
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
