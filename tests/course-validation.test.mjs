import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { validateChapter } from "../app/data/lessons/validate.ts";

test("accepts the complete 10 by 20 daily-food course", () => {
  assert.equal(dailyFoodChapter.lessons.length, 10);
  assert.equal(dailyFoodChapter.lessons.reduce((count, lesson) => count + lesson.words.length, 0), 200);
  assert.deepEqual(
    validateChapter(dailyFoodChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }),
    [],
  );
});

test("rejects duplicate identifiers, duplicate Korean and incomplete records", () => {
  const invalidChapter = structuredClone(dailyFoodChapter);
  invalidChapter.lessons[0].words.push({ ...invalidChapter.lessons[0].words[0], chinese: "" });
  const issues = validateChapter(invalidChapter);
  assert.ok(issues.some((issue) => issue.includes("单词标识重复")));
  assert.ok(issues.some((issue) => issue.includes("韩文词条重复")));
  assert.ok(issues.some((issue) => issue.includes("单词字段不完整")));
});

test("rejects Korean entries containing unsupported spaces", () => {
  const invalidChapter = structuredClone(dailyFoodChapter);
  invalidChapter.lessons[0].words[0].korean = "아침 식사";
  assert.ok(validateChapter(invalidChapter).some((issue) => issue.includes("不支持的空格")));
});
