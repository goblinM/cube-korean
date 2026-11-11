import test from "node:test";
import assert from "node:assert/strict";
import { drawRound, validRoundSize } from "../app/features/typing/round.ts";
import { composeHangul } from "../app/features/spelling/compose-hangul.ts";
import { decomposeHangulToKeystrokes } from "../app/features/spelling/hangul.ts";

test("键盘练习在最大轮次中抽取不同且可照打的词，下一轮避开上一轮", () => {
  const first = drawRound(100);
  const next = drawRound(100, first);
  assert.equal(new Set([...first, ...next]).size, 200);
  for (const word of first) {
    const keys = decomposeHangulToKeystrokes(word).join("");
    assert.match(keys, /^[ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔㅁㄴㅇㄹㅎㅗㅓㅏㅣㅋㅌㅊㅍㅠㅜㅡ]+$/u);
    assert.equal(composeHangul(keys, word), word);
  }
  for (const n of [0, 101, 2.5, NaN]) assert.equal(validRoundSize(n), false);
});
