import type { Chapter } from "../../data/lessons/types.ts";
import {
  DAILY_GOAL_STORAGE_KEY,
  isLearningActivity,
  LEARNING_ACTIVITY_STORAGE_KEY,
  readDailyGoal,
  readLearningActivity,
  type LearningActivity,
} from "./learning-activity.ts";
import { LEARNING_CHECKPOINT_STORAGE_KEY } from "./learning-checkpoint.ts";
import { LEARNING_LOCATION_STORAGE_KEY, readLearningLocation, type LearningLocation } from "./learning-location.ts";
import {
  LEARNING_PREFERENCES_STORAGE_KEY,
  readLearningPreferences,
  type LearningPreferences,
} from "./learning-preferences.ts";
import {
  isCourseProgress,
  PROGRESS_STORAGE_KEY,
  readProgress,
  type CourseProgress,
} from "./local-progress.ts";

export type LearningBackup = {
  version: 1;
  exportedAt: string;
  progress: CourseProgress;
  preferences: LearningPreferences;
  location: LearningLocation | null;
  activity?: LearningActivity;
  dailyGoal?: number;
};

type BackupStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** 将当前设备上的长期学习数据导出为可下载的版本化JSON文本。 */
export function createLearningBackup(storage: BackupStorage, chapters: Chapter[], exportedAt = new Date().toISOString()): string {
  const backup: LearningBackup = {
    version: 1,
    exportedAt,
    progress: readProgress(storage),
    preferences: readLearningPreferences(storage),
    location: readLearningLocation(storage, chapters),
    activity: readLearningActivity(storage),
    dailyGoal: readDailyGoal(storage),
  };
  return JSON.stringify(backup, null, 2);
}

function containsOnlyCurrentCourse(progress: CourseProgress, chapters: Chapter[]): boolean {
  const lessonIds = new Set(chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id)));
  const wordIds = new Set(chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.words.map((word) => word.id))));
  return Object.entries(progress.lessons).every(([lessonId, lesson]) =>
    lessonIds.has(lessonId) && lesson.mistakeIds.every((wordId) => wordIds.has(wordId)))
    && Object.entries(progress.mistakes).every(([wordId, mistake]) => wordIds.has(wordId) && lessonIds.has(mistake.lessonId));
}

function isLearningPreferences(value: unknown): value is LearningPreferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningPreferences>;
  return candidate.version === 1
    && typeof candidate.showEnglish === "boolean"
    && typeof candidate.nativeKeyboard === "boolean"
    && typeof candidate.muted === "boolean";
}

/** 校验并恢复备份；任何字段无效时拒绝整份文件，避免覆盖当前有效进度。 */
export function restoreLearningBackup(storage: BackupStorage, chapters: Chapter[], raw: string): LearningBackup {
  const parsed = JSON.parse(raw) as Partial<LearningBackup>;
  if (parsed.version !== 1 || !isValidExportDate(parsed.exportedAt) || !isCourseProgress(parsed.progress) || !containsOnlyCurrentCourse(parsed.progress, chapters) || !isLearningPreferences(parsed.preferences)) {
    throw new Error("备份文件格式不正确或不属于当前课程");
  }
  if (parsed.activity !== undefined && !isLearningActivity(parsed.activity)) throw new Error("备份中的学习历史无效");
  if (parsed.dailyGoal !== undefined && (!Number.isInteger(parsed.dailyGoal) || parsed.dailyGoal < 1 || parsed.dailyGoal > 5)) throw new Error("备份中的每日目标无效");
  if (parsed.location) {
    const reader = { getItem: (key: string) => key === LEARNING_LOCATION_STORAGE_KEY ? JSON.stringify(parsed.location) : null };
    if (!readLearningLocation(reader, chapters)) throw new Error("备份中的课程位置已经失效");
  }

  const backup = parsed as LearningBackup;
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(backup.progress));
  storage.setItem(LEARNING_PREFERENCES_STORAGE_KEY, JSON.stringify(backup.preferences));
  if (backup.location) storage.setItem(LEARNING_LOCATION_STORAGE_KEY, JSON.stringify(backup.location));
  else storage.removeItem(LEARNING_LOCATION_STORAGE_KEY);
  if (backup.activity) storage.setItem(LEARNING_ACTIVITY_STORAGE_KEY, JSON.stringify(backup.activity));
  else storage.removeItem(LEARNING_ACTIVITY_STORAGE_KEY);
  storage.setItem(DAILY_GOAL_STORAGE_KEY, String(backup.dailyGoal ?? 1));
  storage.removeItem(LEARNING_CHECKPOINT_STORAGE_KEY);
  return backup;
}

function isValidExportDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

/** 清除当前设备上的进度、偏好、位置和未完成会话。 */
export function clearAllLearningData(storage: BackupStorage): void {
  for (const key of [PROGRESS_STORAGE_KEY, LEARNING_PREFERENCES_STORAGE_KEY, LEARNING_LOCATION_STORAGE_KEY, LEARNING_CHECKPOINT_STORAGE_KEY, LEARNING_ACTIVITY_STORAGE_KEY, DAILY_GOAL_STORAGE_KEY]) {
    storage.removeItem(key);
  }
}
