import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceLessonGroup,
  canResumeLessonSession,
  createLessonSession,
  createReviewSession,
  hasNextLessonGroup,
  SPELLING_REVEAL_ERROR_LIMIT,
  shouldRevealSpelling,
  submitLessonAnswer,
  summarizeLessonSession,
} from "../app/features/lessons/session.ts";

test("moves from copy to listen while preserving the original word order", () => {
  let session = createLessonSession(["coffee", "beer"]);
  session = submitLessonAnswer(session, "coffee", true);
  session = submitLessonAnswer(session, "beer", true);
  assert.equal(session.phase, "listen");
  assert.deepEqual(session.queue, ["coffee", "beer"]);
  assert.equal(session.position, 0);
});

test("records first-listen accuracy and sends mistakes to retry", () => {
  let session = createLessonSession(["coffee", "beer"]);
  session = submitLessonAnswer(session, "coffee", true);
  session = submitLessonAnswer(session, "beer", true);
  session = submitLessonAnswer(session, "coffee", true);
  session = submitLessonAnswer(session, "beer", false);
  session = submitLessonAnswer(session, "beer", true);
  assert.equal(session.phase, "retry");
  assert.deepEqual(session.queue, ["beer"]);
  assert.equal(session.firstListenCorrect, 1);
  assert.deepEqual(session.mistakeIds, ["beer"]);
});

test("finishes only after every retry word is corrected", () => {
  let session = createLessonSession(["coffee"]);
  session = submitLessonAnswer(session, "coffee", true);
  session = submitLessonAnswer(session, "coffee", false);
  session = submitLessonAnswer(session, "coffee", true);
  assert.equal(session.phase, "retry");
  session = submitLessonAnswer(session, "coffee", false);
  assert.equal(session.phase, "retry");
  session = submitLessonAnswer(session, "coffee", true);
  assert.equal(session.phase, "results");
});

test("ignores submissions for a word that is not currently active", () => {
  const session = createLessonSession(["coffee", "beer"]);
  assert.equal(submitLessonAnswer(session, "beer", true), session);
});

test("starts mistake review in dictation mode and remembers failed review words", () => {
  let session = createReviewSession(["coffee", "beer"]);
  assert.equal(session.phase, "retry");
  session = submitLessonAnswer(session, "coffee", false);
  session = submitLessonAnswer(session, "coffee", true);
  session = submitLessonAnswer(session, "beer", true);
  assert.equal(session.phase, "results");
  assert.deepEqual(session.mistakeIds, ["coffee"]);
});

test("reveals a dictation spelling on the second error and resets for the next word", () => {
  assert.equal(SPELLING_REVEAL_ERROR_LIMIT, 2);
  let session = createReviewSession(["coffee", "beer"]);
  session = submitLessonAnswer(session, "coffee", false);
  assert.equal(session.currentErrorCount, 1);
  assert.equal(shouldRevealSpelling(session), false);
  session = submitLessonAnswer(session, "coffee", false);
  assert.equal(session.currentErrorCount, 2);
  assert.equal(shouldRevealSpelling(session), true);
  session = submitLessonAnswer(session, "coffee", true);
  assert.equal(session.currentErrorCount, 0);
  assert.equal(shouldRevealSpelling(session), false);
});

test("does not reveal spelling during the copy phase", () => {
  let session = createLessonSession(["coffee"]);
  session = submitLessonAnswer(session, "coffee", false);
  session = submitLessonAnswer(session, "coffee", false);
  assert.equal(shouldRevealSpelling(session), false);
});

test("splits a lesson into five-word groups and preserves whole-lesson results", () => {
  const wordIds = Array.from({ length: 12 }, (_, index) => `word-${index + 1}`);
  let session = createLessonSession(wordIds);
  assert.deepEqual(session.queue, wordIds.slice(0, 5));

  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  for (const wordId of session.originalWordIds) {
    if (wordId === "word-2") session = submitLessonAnswer(session, wordId, false);
    session = submitLessonAnswer(session, wordId, true);
  }
  session = submitLessonAnswer(session, "word-2", true);
  assert.equal(hasNextLessonGroup(session), true);
  assert.equal(canResumeLessonSession(session, wordIds), true);
  assert.equal(canResumeLessonSession(session, [...wordIds].reverse()), false);

  session = advanceLessonGroup(session);
  assert.equal(session.groupIndex, 1);
  assert.deepEqual(session.queue, wordIds.slice(5, 10));
  assert.deepEqual(session.completedMistakeIds, ["word-2"]);

  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  session = advanceLessonGroup(session);
  assert.deepEqual(session.queue, wordIds.slice(10));

  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  for (const wordId of session.originalWordIds) session = submitLessonAnswer(session, wordId, true);
  assert.equal(hasNextLessonGroup(session), false);
  assert.equal(canResumeLessonSession(session, wordIds), false);
  assert.deepEqual(summarizeLessonSession(session), {
    wordCount: 12,
    firstListenCorrect: 11,
    mistakeIds: ["word-2"],
  });
});
