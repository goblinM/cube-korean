import assert from "node:assert/strict";
import test from "node:test";
import { COURSE_WORDS } from "../app/data/lessons/course.ts";
import { composeHangul } from "../app/features/spelling/compose-hangul.ts";
import { decomposeHangulToKeystrokes, followsTargetPrefix, isExactSpelling } from "../app/features/spelling/hangul.ts";

test("all course words stay valid through every page-keyboard intermediate state", () => {
  assert.equal(COURSE_WORDS.length, 2000);

  for (const { chapterId, lessonId, word } of COURSE_WORDS) {
    const keys = decomposeHangulToKeystrokes(word.korean);
    const context = `${chapterId}/${lessonId}/${word.id} (${word.korean})`;
    assert.ok(keys.length > 0, context);

    for (let count = 0; count <= keys.length; count += 1) {
      const typed = composeHangul(keys.slice(0, count).join(""), word.korean);
      assert.equal(followsTargetPrefix(typed, word.korean), true, `${context}: ${count}/${keys.length} → ${typed}`);
      assert.equal(isExactSpelling(typed, word.korean), count === keys.length, `${context}: ${count}/${keys.length} → ${typed}`);
    }
  }
});

test("deletion and middle correction restore a valid prefix without accepting wrong input", () => {
  const target = "달걀";
  const keys = decomposeHangulToKeystrokes(target);
  const missingFinal = composeHangul(keys.slice(0, -1).join(""), target);
  assert.equal(missingFinal, "달갸");
  assert.equal(followsTargetPrefix(missingFinal, target), true);
  assert.equal(isExactSpelling(missingFinal, target), false);
  assert.equal(followsTargetPrefix("달가", target), false);
  assert.equal(followsTargetPrefix("달가ㄹ", target), false);
  assert.equal(followsTargetPrefix("달갸", target), true);
  assert.equal(composeHangul(keys.join(""), target), target);
});

test("an inserted syllable and a wrong syllable boundary do not pass the prefix check", () => {
  assert.equal(followsTargetPrefix("커피가", "커피"), false);
  assert.equal(followsTargetPrefix("랃데", "라떼"), false);
  assert.equal(followsTargetPrefix("고일", "과일"), false);
  assert.equal(followsTargetPrefix("과", "과일"), true);
});
