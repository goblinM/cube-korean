import assert from "node:assert/strict";
import test from "node:test";
import { composeHangul } from "../app/features/spelling/compose-hangul.ts";

test("composes simple words from page-keyboard jamo", () => {
  assert.equal(composeHangul("ㅋㅓㅍㅣ"), "커피");
  assert.equal(composeHangul("ㅁㅐㄱㅈㅜ"), "맥주");
});

test("moves a provisional final consonant into the next syllable", () => {
  assert.equal(composeHangul("ㅇㅜㅇㅠ"), "우유");
  assert.equal(composeHangul("ㄹㅏㅌㅔ"), "라테");
  assert.equal(composeHangul("ㄷㅏㄹㄱㅑ", "달걀"), "달갸");
  assert.equal(composeHangul("ㄷㅏㄹㄱㅑㄹ", "달걀"), "달걀");
});

test("supports compound vowels, double initials and compound finals", () => {
  assert.equal(composeHangul("ㄱㅗㅏㅇㅣㄹ"), "과일");
  assert.equal(composeHangul("ㄸㅏㄹㄱㅣ"), "딸기");
  assert.equal(composeHangul("ㄱㅏㅂㅅ"), "값");
});

test("uses the target to resolve an ambiguous repeated consonant", () => {
  assert.equal(composeHangul("ㄹㅏㄷㄷㅔ", "라떼"), "라떼");
  assert.equal(composeHangul("ㅇㅏㄱㄱㅣ", "악기"), "악기");
  assert.equal(composeHangul("ㅇㅗㅣㄴㅈㅈㅗㄱ", "왼쪽"), "왼쪽");
  assert.equal(composeHangul("ㄴㅏㄹㅅㅅㅣ", "날씨"), "날씨");
  assert.equal(composeHangul("ㅅㅣㄴㅂㅏㄹㄱㄱㅡㄴ", "신발끈"), "신발끈");
});

test("keeps incomplete input visible", () => {
  assert.equal(composeHangul("ㅋ"), "ㅋ");
  assert.equal(composeHangul("ㅋㅓㅍ"), "컾");
});
