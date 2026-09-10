import assert from "node:assert/strict";
import test from "node:test";
import { koreanAudioUrl, playKorean, speakKorean } from "../app/features/speech/korean-speech.ts";

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

test("maps a stable word id to a shared static audio URL", () => {
  assert.equal(koreanAudioUrl("coffee"), "/audio/ko/coffee.mp3");
  assert.equal(koreanAudioUrl("word with space"), "/audio/ko/word%20with%20space.mp3");
});

test("plays the pre-generated audio before trying browser speech", async () => {
  const calls = [];
  class Audio {
    constructor() { this.src = ""; this.preload = ""; this.currentTime = 0; }
    pause() { calls.push("pause"); }
    play() { calls.push(["audio", this.src]); return Promise.resolve(); }
  }
  class Utterance { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; } }
  const environment = {
    Audio,
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: { speak: () => calls.push("speech") },
  };

  assert.equal(await playKorean("coffee", "커피", environment), true);
  assert.deepEqual(calls, [["audio", "/audio/ko/coffee.mp3"]]);
});

test("falls back to browser speech when the static audio cannot play", async () => {
  const calls = [];
  class Audio {
    constructor() { this.src = ""; this.preload = ""; this.currentTime = 0; }
    pause() {}
    play() { return Promise.reject(new Error("missing")); }
  }
  class Utterance { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; } }
  const environment = {
    Audio,
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: { speak: (value) => calls.push(value.text) },
  };

  assert.equal(await playKorean("coffee", "커피", environment), true);
  assert.deepEqual(calls, ["커피"]);
});

test("returns false when neither static audio nor browser speech is available", async () => {
  class Audio {
    constructor() { this.src = ""; this.preload = ""; this.currentTime = 0; }
    pause() {}
    play() { return Promise.reject(new Error("missing")); }
  }

  assert.equal(await playKorean("coffee", "커피", { Audio }), false);
});
