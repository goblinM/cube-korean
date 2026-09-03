import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { validateChapter } from "../app/data/lessons/validate.ts";

test("accepts the currently reviewed prototype course data", () => {
  assert.deepEqual(validateChapter(dailyFoodChapter), []);
});

test("reports that prototype content has not reached the 10 by 20 MVP target", () => {
  const issues = validateChapter(dailyFoodChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 });
  assert.equal(issues.length, 2);
  assert.match(issues[0], /10 个小关卡/);
  assert.match(issues[1], /20 个词/);
});

test("rejects duplicate identifiers and incomplete word records", () => {
  const invalidChapter = structuredClone(dailyFoodChapter);
  invalidChapter.lessons[0].words.push({
    ...invalidChapter.lessons[0].words[0],
    chinese: "",
  });
  const issues = validateChapter(invalidChapter);
  assert.ok(issues.some((issue) => issue.includes("单词标识重复")));
  assert.ok(issues.some((issue) => issue.includes("单词字段不完整")));
});
