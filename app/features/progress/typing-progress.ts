export const TYPING_KEY = "cubekorean.typing.v1";
export type TypingProgress = { mode: "course" | "typing"; size: number; hints: boolean; words: number };
export const defaultTyping: TypingProgress = { mode: "course", size: 30, hints: true, words: 0 };

export function isTypingProgress(value: unknown): value is TypingProgress {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<TypingProgress>;
  return (data.mode === "course" || data.mode === "typing") && typeof data.hints === "boolean"
    && typeof data.size === "number" && Number.isInteger(data.size) && data.size >= 1 && data.size <= 100
    && typeof data.words === "number" && Number.isSafeInteger(data.words) && data.words >= 0;
}

export function readTypingProgress(storage: Pick<Storage, "getItem">): TypingProgress {
  try {
    const value: unknown = JSON.parse(storage.getItem(TYPING_KEY) ?? "null");
    if (isTypingProgress(value)) return value;
  } catch { /* An invalid local record starts a fresh practice history. */ }
  return defaultTyping;
}
