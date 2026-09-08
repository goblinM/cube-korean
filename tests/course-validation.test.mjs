import assert from "node:assert/strict";
import test from "node:test";
import { dailyFoodChapter } from "../app/data/lessons/daily-food.ts";
import { dailyTravelChapter } from "../app/data/lessons/daily-travel.ts";
import { hotelStayChapter } from "../app/data/lessons/hotel-stay.ts";
import { hospitalCareChapter } from "../app/data/lessons/hospital-care.ts";
import { workLifeChapter } from "../app/data/lessons/work-life.ts";
import { shoppingLifeChapter } from "../app/data/lessons/shopping-life.ts";
import { tourismChapter } from "../app/data/lessons/tourism.ts";
import { COURSE_WORDS } from "../app/data/lessons/course.ts";
import { validateChapter } from "../app/data/lessons/validate.ts";

test("accepts the complete 10 by 20 daily-food course", () => {
  assert.equal(dailyFoodChapter.lessons.length, 10);
  assert.equal(dailyFoodChapter.lessons.reduce((count, lesson) => count + lesson.words.length, 0), 200);
  assert.deepEqual(
    validateChapter(dailyFoodChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }),
    [],
  );
});

test("accepts the complete 10 by 20 daily-travel course with global word ids", () => {
  assert.equal(dailyTravelChapter.lessons.length, 10);
  assert.equal(dailyTravelChapter.lessons.reduce((count, lesson) => count + lesson.words.length, 0), 200);
  assert.deepEqual(validateChapter(dailyTravelChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }), []);
  assert.equal(COURSE_WORDS.length, 2000);
  assert.equal(new Set(COURSE_WORDS.map((entry) => entry.word.id)).size, 2000);
});

test("accepts the hotel-stay migration and complete 10 by 20 chapter", () => {
  assert.equal(hotelStayChapter.lessons.length, 10);
  assert.equal(hotelStayChapter.lessons.reduce((count, lesson) => count + lesson.words.length, 0), 200);
  assert.deepEqual(validateChapter(hotelStayChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }), []);
  assert.equal(hotelStayChapter.lessons[0].id, "accommodation");
  assert.ok(hotelStayChapter.lessons[0].words.some((word) => word.id === "travel-accommodation-1"));
  assert.equal(new Set(hotelStayChapter.lessons.flatMap((lesson) => lesson.words.map((word) => word.korean))).size, 200);
});

test("contains all ten planned chapters at 10 by 20", () => {
  assert.equal(COURSE_WORDS.length, 2000);
  const chapterCounts = new Map();
  for (const entry of COURSE_WORDS) chapterCounts.set(entry.chapterId, (chapterCounts.get(entry.chapterId) ?? 0) + 1);
  assert.equal(chapterCounts.size, 10);
  for (const count of chapterCounts.values()) assert.equal(count, 200);
});

test("accepts the curated hospital chapter without generated compounds", () => {
  assert.deepEqual(validateChapter(hospitalCareChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }), []);
  assert.equal(hospitalCareChapter.lessons.flatMap((lesson) => lesson.words).length, 200);
  assert.ok(hospitalCareChapter.lessons[0].words.some((word) => word.korean === "접수" && word.chinese === "挂号"));
});

test("accepts the curated work chapter without generated compounds", () => {
  assert.deepEqual(validateChapter(workLifeChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }), []);
  assert.equal(workLifeChapter.lessons.flatMap((lesson) => lesson.words).length, 200);
});

test("accepts the curated shopping chapter without generated compounds", () => {
  assert.deepEqual(validateChapter(shoppingLifeChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }), []);
  assert.equal(shoppingLifeChapter.lessons.flatMap((lesson) => lesson.words).length, 200);
});

test("accepts the curated tourism chapter without generated compounds", () => {
  assert.deepEqual(validateChapter(tourismChapter, { lessonsPerChapter: 10, wordsPerLesson: 20 }), []);
  assert.equal(tourismChapter.lessons.flatMap((lesson) => lesson.words).length, 200);
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
