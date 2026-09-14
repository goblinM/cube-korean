export const LEARNING_PREFERENCES_STORAGE_KEY = "cubekorean.preferences.v1";

export type TranslationMode = "ko-zh-en" | "ko-zh" | "ko-en";

export type LearningPreferences = {
  version: 1;
  translationMode: TranslationMode;
  nativeKeyboard: boolean;
  muted: boolean;
  autoConfirm: boolean;
};

export const DEFAULT_LEARNING_PREFERENCES: LearningPreferences = {
  version: 1,
  translationMode: "ko-zh-en",
  nativeKeyboard: true,
  muted: false,
  autoConfirm: true,
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

/** 统一校验当前偏好和旧版英文开关，供本机读取与备份恢复共用。 */
export function normalizeLearningPreferences(value: unknown): LearningPreferences | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as Record<string, unknown>;
  const mode = parsed.translationMode === undefined
    ? parsed.showEnglish === true ? "ko-zh-en" : parsed.showEnglish === false ? "ko-zh" : null
    : parsed.translationMode;
  if (
    parsed.version !== 1
    || (mode !== "ko-zh-en" && mode !== "ko-zh" && mode !== "ko-en")
    || typeof parsed.nativeKeyboard !== "boolean"
    || typeof parsed.muted !== "boolean"
    || (parsed.autoConfirm !== undefined && typeof parsed.autoConfirm !== "boolean")
  ) return null;
  return {
    version: 1,
    translationMode: mode,
    nativeKeyboard: parsed.nativeKeyboard,
    muted: parsed.muted,
    autoConfirm: parsed.autoConfirm ?? true,
  };
}

/** 读取用户的练习界面偏好，字段不完整或数据损坏时使用安全默认值。 */
export function readLearningPreferences(storage: StorageReader): LearningPreferences {
  try {
    const raw = storage.getItem(LEARNING_PREFERENCES_STORAGE_KEY);
    return raw ? normalizeLearningPreferences(JSON.parse(raw)) ?? DEFAULT_LEARNING_PREFERENCES : DEFAULT_LEARNING_PREFERENCES;
  } catch {
    return DEFAULT_LEARNING_PREFERENCES;
  }
}

/** 保存释义显示模式、输入键盘、自动发音和页面键盘自动确认偏好。 */
export function writeLearningPreferences(storage: StorageWriter, preferences: Omit<LearningPreferences, "version">): void {
  storage.setItem(LEARNING_PREFERENCES_STORAGE_KEY, JSON.stringify({ version: 1, ...preferences } satisfies LearningPreferences));
}
