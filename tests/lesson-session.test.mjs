import assert from "node:assert/strict";
import test from "node:test";
import { createLessonSession, submitLessonAnswer } from "../app/features/lessons/session.ts";

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
