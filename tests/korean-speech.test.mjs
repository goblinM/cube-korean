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
    speechSynthesis: { cancel: () => calls.push("cancel"), speak: (value) => calls.push(value) },
  };

  assert.equal(speakKorean("커피", environment), true);
  assert.equal(calls[0], "cancel");
  assert.equal(calls[1].text, "커피");
  assert.equal(calls[1].lang, "ko-KR");
  assert.equal(calls[1].rate, 0.9);
});
