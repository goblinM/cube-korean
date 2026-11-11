import { COURSE_WORDS } from "../../data/lessons/course.ts";
import { composeHangul } from "../spelling/compose-hangul.ts";
import { decomposeHangulToKeystrokes } from "../spelling/hangul.ts";

export const MAX_ROUND_SIZE = 100;
const wordPool = [...new Set(COURSE_WORDS.map(({ word }) => word.korean))]
  .filter(word => /^[가-힣]+$/u.test(word) && composeHangul(decomposeHangulToKeystrokes(word).join(""), word) === word);

export function validRoundSize(size: number) {
  return Number.isInteger(size) && size >= 1 && size <= Math.min(MAX_ROUND_SIZE, wordPool.length);
}

export function drawRound(size: number, previous: readonly string[] = []): string[] {
  if (!validRoundSize(size)) throw new RangeError("Invalid typing round size");
  const used = new Set(previous);
  const fresh = wordPool.filter(word => !used.has(word));
  const candidates = fresh.length >= size ? fresh : [...wordPool];
  for (let index = 0; index < size; index++) {
    const swap = index + Math.floor(Math.random() * (candidates.length - index));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }
  return candidates.slice(0, size);
}
