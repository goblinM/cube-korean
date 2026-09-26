import assert from "node:assert/strict";
import test from "node:test";
import { CHAPTERS, COURSE_WORDS } from "../app/data/lessons/course.ts";
import { missingEnglishCourseTitleIds } from "../app/i18n/course-titles.ts";
import { en, zhCN } from "../app/i18n/messages.ts";

test("Chinese and English UI dictionaries contain the same non-empty keys", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zhCN).sort());
  assert.equal(Object.values(zhCN).every((value) => value.trim()), true);
  assert.equal(Object.values(en).every((value) => value.trim()), true);
});

test("every current chapter, lesson and word has complete English content", () => {
  assert.deepEqual(missingEnglishCourseTitleIds(CHAPTERS), []);
  assert.equal(COURSE_WORDS.length, 2_000);
  assert.deepEqual(COURSE_WORDS.filter(({ word }) => !word.english.trim()).map(({ word }) => word.id), []);
});
