export const PRACTICE_GUIDE_STORAGE_KEY = "cubekorean.practice-guide.v1";

type GuideStorage = Pick<Storage, "getItem" | "setItem">;

/** 判断当前设备是否需要展示首次练习指引；存储不可用时仍展示，避免新用户失去说明。 */
export function shouldShowPracticeGuide(storage: Pick<GuideStorage, "getItem">): boolean {
  try {
    return storage.getItem(PRACTICE_GUIDE_STORAGE_KEY) !== "seen";
  } catch {
    return true;
  }
}

/** 记录当前设备已完成练习指引；存储不可用时静默降级，不阻断拼写练习。 */
export function markPracticeGuideSeen(storage: Pick<GuideStorage, "setItem">): void {
  try {
    storage.setItem(PRACTICE_GUIDE_STORAGE_KEY, "seen");
  } catch {
    // 本机存储属于增强能力，写入失败不应影响核心练习流程。
  }
}
