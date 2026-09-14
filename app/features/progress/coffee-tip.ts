import type { CourseProgress } from "./local-progress";

export const COFFEE_TIP_STORAGE_KEY = "cubekorean.coffee-tip.v1";
export const COFFEE_TIP_MILESTONES = [3, 10, 25, 39, 55, 74, 100] as const;

export type CoffeeTipState = {
  dismissed: boolean;
  shownMilestones: number[];
};

type StorageReader = Pick<Storage, "getItem">;
type StorageWriter = Pick<Storage, "setItem">;

export function readCoffeeTipState(storage: StorageReader): CoffeeTipState {
  try {
    const raw = storage.getItem(COFFEE_TIP_STORAGE_KEY);
    if (!raw) return { dismissed: false, shownMilestones: [] };
    const parsed = JSON.parse(raw) as Partial<CoffeeTipState>;
    if (typeof parsed.dismissed !== "boolean" || !Array.isArray(parsed.shownMilestones)) {
      return { dismissed: false, shownMilestones: [] };
    }
    return {
      dismissed: parsed.dismissed,
      shownMilestones: parsed.shownMilestones.filter((value): value is number =>
        typeof value === "number" && COFFEE_TIP_MILESTONES.some((milestone) => milestone === value)),
    };
  } catch {
    return { dismissed: false, shownMilestones: [] };
  }
}

/** 整关结算时补发最近一个未展示的已达成里程碑，避免旧进度或重练漏掉新加入的提示。 */
export function getCoffeeTipMilestone(
  previous: CourseProgress,
  updated: CourseProgress,
  state: CoffeeTipState,
): number | null {
  if (state.dismissed) return null;
  const before = Object.keys(previous.lessons).length;
  const after = Object.keys(updated.lessons).length;
  if (after < before || after > before + 1) return null;
  const latestShown = Math.max(0, ...state.shownMilestones);
  return [...COFFEE_TIP_MILESTONES].reverse().find((milestone) =>
    milestone <= after && milestone > latestShown && !state.shownMilestones.includes(milestone)) ?? null;
}

export function markCoffeeTipShown(storage: StorageReader & StorageWriter, milestone: number): void {
  const state = readCoffeeTipState(storage);
  storage.setItem(COFFEE_TIP_STORAGE_KEY, JSON.stringify({
    ...state,
    shownMilestones: [...new Set([...state.shownMilestones, milestone])],
  }));
}

export function dismissFutureCoffeeTips(storage: StorageReader & StorageWriter): void {
  storage.setItem(COFFEE_TIP_STORAGE_KEY, JSON.stringify({ ...readCoffeeTipState(storage), dismissed: true }));
}
