import assert from "node:assert/strict";
import test from "node:test";
import {
  decomposeHangul,
  decomposeHangulToKeystrokes,
  followsTargetPrefix,
  isExactSpelling,
} from "../app/features/spelling/hangul.ts";

test("decomposes syllables including finals and compound vowels", () => {
  assert.equal(decomposeHangul("커피"), "ㅋㅓㅍㅣ");
  assert.equal(decomposeHangul("맥주"), "ㅁㅐㄱㅈㅜ");
  assert.equal(decomposeHangul("과"), "ㄱㅘ");
  assert.equal(decomposeHangul("값"), "ㄱㅏㅄ");
});

test("returns the actual page-keyboard sequence for Korean spelling hints", () => {
  assert.deepEqual(decomposeHangulToKeystrokes("안"), ["ㅇ", "ㅏ", "ㄴ"]);
  assert.deepEqual(decomposeHangulToKeystrokes("커피"), ["ㅋ", "ㅓ", "ㅍ", "ㅣ"]);
  assert.deepEqual(decomposeHangulToKeystrokes("과일"), ["ㄱ", "ㅗ", "ㅏ", "ㅇ", "ㅣ", "ㄹ"]);
  assert.deepEqual(decomposeHangulToKeystrokes("값"), ["ㄱ", "ㅏ", "ㅂ", "ㅅ"]);
  assert.deepEqual(decomposeHangulToKeystrokes("딸기"), ["ㄷ", "ㄷ", "ㅏ", "ㄹ", "ㄱ", "ㅣ"]);
  assert.deepEqual(decomposeHangulToKeystrokes("라떼"), ["ㄹ", "ㅏ", "ㄷ", "ㄷ", "ㅔ"]);
});

test("accepts every valid IME prefix for 커피", () => {
  for (const value of ["", "ㅋ", "커", "커ㅍ", "커피"]) {
    assert.equal(followsTargetPrefix(value, "커피"), true, value);
  }
});

test("accepts a basic consonant while a double initial is being entered", () => {
  assert.equal(followsTargetPrefix("라", "라떼"), true);
  assert.equal(followsTargetPrefix("랃", "라떼"), true);
  assert.equal(followsTargetPrefix("랃ㄷ", "라떼"), true);
  assert.equal(followsTargetPrefix("라떼", "라떼"), true);
  assert.equal(followsTargetPrefix("랃데", "라떼"), false);
});

test("rejects a prefix after its vowel, final, or next syllable diverges", () => {
  assert.equal(followsTargetPrefix("코", "커피"), false);
  assert.equal(followsTargetPrefix("먼", "맥주"), false);
  assert.equal(followsTargetPrefix("맥지", "맥주"), false);
  assert.equal(followsTargetPrefix("커피가", "커피"), false);
});

test("requires an exact completed spelling for submission", () => {
  assert.equal(isExactSpelling("커", "커피"), false);
  assert.equal(isExactSpelling("커피", "커피"), true);
  assert.equal(isExactSpelling("코피", "커피"), false);
});
