import assert from "node:assert/strict";
import test from "node:test";
import { speakKorean } from "../app/features/speech/korean-speech.ts";

test("returns false when speech synthesis is unavailable", () => {
  assert.equal(speakKorean("커피", {}), false);
});

test("configures Korean speech without owning the learning flow", () => {
  const calls = [];
  class Utterance { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; } }
  const environment = {
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: { resume: () => calls.push("resume"), speak: (value) => calls.push(value) },
  };

  assert.equal(speakKorean("커피", environment), true);
  assert.equal(calls[0], "resume");
  assert.equal(calls[1].text, "커피");
  assert.equal(calls[1].lang, "ko-KR");
  assert.equal(calls[1].rate, 0.78);
  assert.equal(typeof calls[1].onend, "function");
  assert.equal(typeof calls[1].onerror, "function");
});
