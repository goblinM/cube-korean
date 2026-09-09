export const LEARNING_PREFERENCES_STORAGE_KEY = "cubekorean.preferences.v1";

export type LearningPreferences = {
  version: 1;
  showEnglish: boolean;
  nativeKeyboard: boolean;
  muted: boolean;
};

export const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  version: 1,
  showEnglish: true,
  nativeKeyboard: true,
  muted: false,
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

/** 读取用户的练习界面偏好，字段不完整或数据损坏时使用安全默认值。 */
export function readLearningPreferences(storage: StorageReader): LearningPreferences {
  try {
    const raw = storage.getItem(LEARNING_PREFERENCES_STORAGE_KEY);
    if (!raw) return DEFAULT_LEARNING_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<LearningPreferences>;
    if (
      parsed.version !== 1
      || typeof parsed.showEnglish !== "boolean"
      || typeof parsed.nativeKeyboard !== "boolean"
      || typeof parsed.muted !== "boolean"
    ) return DEFAULT_LEARNING_PREFERENCES;
    return parsed as LearningPreferences;
  } catch {
    return DEFAULT_LEARNING_PREFERENCES;
  }
}

/** 保存英文释义、输入键盘和自动发音偏好。 */
export function writeLearningPreferences(storage: StorageWriter, preferences: Omit<LearningPreferences, "version">): void {
  storage.setItem(LEARNING_PREFERENCES_STORAGE_KEY, JSON.stringify({ version: 1, ...preferences } satisfies LearningPreferences));
}
