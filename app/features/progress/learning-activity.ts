export const LEARNING_ACTIVITY_STORAGE_KEY = "cubekorean.activity.v1";
export const DAILY_GOAL_STORAGE_KEY = "cubekorean.daily-goal.v1";

export type DailyLearningActivity = {
  sessions: number;
  words: number;
  accuracyTotal: number;
  studiedWordIds?: string[];
};

export type LearningActivity = {
  version: 1;
  days: Record<string, DailyLearningActivity>;
};

export type WeeklyActivityDay = DailyLearningActivity & {
  key: string;
  label: string;
  isToday: boolean;
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function createEmptyLearningActivity(): LearningActivity {
  return { version: 1, days: {} };
}

/** 使用用户本地时区生成稳定日期键，避免跨午夜记录到错误日期。 */
export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isLearningActivity(value: unknown): value is LearningActivity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningActivity>;
  return candidate.version === 1 && Boolean(candidate.days) && typeof candidate.days === "object"
    && Object.entries(candidate.days ?? {}).every(([key, day]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(key)
      && day
      && Number.isInteger(day.sessions) && day.sessions >= 0
      && Number.isInteger(day.words) && day.words >= 0
      && typeof day.accuracyTotal === "number" && Number.isFinite(day.accuracyTotal) && day.accuracyTotal >= 0
      && (day.studiedWordIds === undefined || (Array.isArray(day.studiedWordIds)
        && day.studiedWordIds.every((id) => typeof id === "string" && id.length > 0)
        && new Set(day.studiedWordIds).size === day.studiedWordIds.length)));
}

/** 读取每日学习活动；损坏或未知版本的数据不会进入统计。 */
export function readLearningActivity(storage: StorageReader): LearningActivity {
  try {
    const parsed = JSON.parse(storage.getItem(LEARNING_ACTIVITY_STORAGE_KEY) ?? "null");
    return isLearningActivity(parsed) ? parsed : createEmptyLearningActivity();
  } catch {
    return createEmptyLearningActivity();
  }
}

/** 首次输入或主动查看一个词时，按本地日期去重记录实际练过的词。 */
export function recordStudiedWord(storage: StorageWriter & StorageReader, wordId: string, studiedAt = new Date()): LearningActivity {
  const activity = readLearningActivity(storage);
  const key = localDateKey(studiedAt);
  const previous = activity.days[key] ?? { sessions: 0, words: 0, accuracyTotal: 0 };
  const studiedWordIds = previous.studiedWordIds ?? [];
  if (!wordId || studiedWordIds.includes(wordId)) return activity;
  const updated = {
    ...activity,
    days: {
      ...activity.days,
      [key]: { ...previous, words: previous.words + 1, studiedWordIds: [...studiedWordIds, wordId] },
    },
  };
  storage.setItem(LEARNING_ACTIVITY_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/** 仅在课程或专项复习结算时增加完成轮次和正确率；词数由逐词练习记录。 */
export function recordLearningActivity(
  storage: StorageWriter & StorageReader,
  accuracy: number,
  completedAt = new Date(),
): LearningActivity {
  const activity = readLearningActivity(storage);
  const key = localDateKey(completedAt);
  const previous = activity.days[key] ?? { sessions: 0, words: 0, accuracyTotal: 0 };
  const updated = {
    ...activity,
    days: {
      ...activity.days,
      [key]: {
        sessions: previous.sessions + 1,
        words: previous.words,
        accuracyTotal: previous.accuracyTotal + Math.min(100, Math.max(0, accuracy)),
        ...(previous.studiedWordIds ? { studiedWordIds: previous.studiedWordIds } : {}),
      },
    },
  };
  storage.setItem(LEARNING_ACTIVITY_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/** 读取1到5轮的每日目标，其他值回退到每天1轮。 */
export function readDailyGoal(storage: StorageReader): number {
  const goal = Number(storage.getItem(DAILY_GOAL_STORAGE_KEY));
  return Number.isInteger(goal) && goal >= 1 && goal <= 5 ? goal : 1;
}

export function writeDailyGoal(storage: StorageWriter, goal: number): void {
  if (!Number.isInteger(goal) || goal < 1 || goal > 5) return;
  storage.setItem(DAILY_GOAL_STORAGE_KEY, String(goal));
}

/** 计算近七日学习量和连续学习天数；当天尚未学习时允许延续到昨天的连续记录。 */
export function summarizeLearningActivity(activity: LearningActivity, today = new Date()) {
  const days: WeeklyActivityDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = localDateKey(date);
    const value = activity.days[key] ?? { sessions: 0, words: 0, accuracyTotal: 0 };
    days.push({ ...value, key, label: `${date.getMonth() + 1}/${date.getDate()}`, isToday: offset === 0 });
  }

  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const activeOn = (date: Date) => {
    const day = activity.days[localDateKey(date)];
    return Boolean(day && (day.sessions > 0 || day.words > 0));
  };
  if (!activeOn(cursor)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeOn(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { days, streak, today: days[days.length - 1] };
}
