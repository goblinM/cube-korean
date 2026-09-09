import type { Chapter } from "../../data/lessons/types.ts";

export const LEARNING_LOCATION_STORAGE_KEY = "cubekorean.location.v1";

export type LearningLocation = {
  version: 1;
  chapterId: string;
  lessonId: string;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

/** 读取并校验用户最后浏览的课程位置，失效关卡或损坏数据不会影响首页加载。 */
export function readLearningLocation(storage: StorageReader, chapters: Chapter[]): LearningLocation | null {
  try {
    const raw = storage.getItem(LEARNING_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LearningLocation>;
    if (parsed.version !== 1 || typeof parsed.chapterId !== "string" || typeof parsed.lessonId !== "string") return null;
    const chapter = chapters.find((candidate) => candidate.id === parsed.chapterId);
    if (!chapter?.lessons.some((lesson) => lesson.id === parsed.lessonId)) return null;
    return parsed as LearningLocation;
  } catch {
    return null;
  }
}

/** 保存用户最后浏览的大关卡和小关卡，使刷新后可以回到相同课程位置。 */
export function writeLearningLocation(storage: StorageWriter, chapterId: string, lessonId: string): void {
  storage.setItem(LEARNING_LOCATION_STORAGE_KEY, JSON.stringify({ version: 1, chapterId, lessonId } satisfies LearningLocation));
}
