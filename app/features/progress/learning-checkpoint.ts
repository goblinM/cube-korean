import type { Chapter } from "../../data/lessons/types.ts";
import type { LessonSession } from "../lessons/session.ts";

export const LEARNING_CHECKPOINT_STORAGE_KEY = "cubekorean.checkpoint.v1";

export type LearningCheckpoint = {
  version: 1;
  practiceMode: "lesson" | "mistakes";
  selectedChapterId: string;
  selectedLessonId: string;
  reviewWordIds: string[];
  session: LessonSession;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem" | "removeItem">;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** 读取未完成练习，并确认章节、题目队列和会话位置仍与当前课程匹配。 */
export function readLearningCheckpoint(storage: StorageReader, chapters: Chapter[]): LearningCheckpoint | null {
  try {
    const raw = storage.getItem(LEARNING_CHECKPOINT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LearningCheckpoint>;
    const chapter = chapters.find((candidate) => candidate.id === parsed.selectedChapterId);
    const lesson = chapter?.lessons.find((candidate) => candidate.id === parsed.selectedLessonId);
    const session = parsed.session as Partial<LessonSession> | undefined;
    if (
      parsed.version !== 1
      || (parsed.practiceMode !== "lesson" && parsed.practiceMode !== "mistakes")
      || !chapter
      || !lesson
      || !isStringArray(parsed.reviewWordIds)
      || !session
      || !["copy", "listen", "retry"].includes(session.phase ?? "")
      || !isStringArray(session.queue)
      || !session.queue.length
      || !isStringArray(session.originalWordIds)
      || !isStringArray(session.mistakeIds)
      || !Number.isInteger(session.position)
      || (session.position ?? -1) < 0
      || (session.position ?? 0) >= session.queue.length
      || typeof session.firstListenCorrect !== "number"
      || !Number.isFinite(session.firstListenCorrect)
      || session.firstListenCorrect < 0
      || session.firstListenCorrect > session.originalWordIds.length
      || typeof session.currentHadError !== "boolean"
    ) return null;

    const allWordIds = new Set(chapters.flatMap((item) => item.lessons.flatMap((entry) => entry.words.map((word) => word.id))));
    const lessonWordIds = new Set(lesson.words.map((word) => word.id));
    const sessionWordIds = [...session.queue, ...session.originalWordIds, ...session.mistakeIds];
    const allowedWordIds = parsed.practiceMode === "lesson" ? lessonWordIds : allWordIds;
    if (sessionWordIds.some((id) => !allowedWordIds.has(id))) return null;
    if (parsed.practiceMode === "mistakes" && parsed.reviewWordIds.some((id) => !allWordIds.has(id))) return null;

    return parsed as LearningCheckpoint;
  } catch {
    return null;
  }
}

/** 保存当前未完成练习的位置和轮次，不保存尚未提交的临时输入。 */
export function writeLearningCheckpoint(storage: StorageWriter, checkpoint: Omit<LearningCheckpoint, "version">): void {
  storage.setItem(LEARNING_CHECKPOINT_STORAGE_KEY, JSON.stringify({ version: 1, ...checkpoint } satisfies LearningCheckpoint));
}

/** 在主动退出或完成练习后移除恢复点，避免再次打开已经结束的会话。 */
export function clearLearningCheckpoint(storage: StorageWriter): void {
  storage.removeItem(LEARNING_CHECKPOINT_STORAGE_KEY);
}
