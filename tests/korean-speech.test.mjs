import assert from "node:assert/strict";
import test from "node:test";
import { selectKoreanVoice, speakKorean } from "../app/features/speech/korean-speech.ts";

test("returns false when speech synthesis is unavailable", () => {
  assert.equal(speakKorean("커피", {}), false);
});

test("configures Korean speech without owning the learning flow", () => {
  const calls = [];
  const koreanVoice = { lang: "ko-KR" };
  class Utterance { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; this.pitch = 0; } }
  const environment = {
    SpeechSynthesisUtterance: Utterance,
    speechSynthesis: {
      cancel: () => calls.push("cancel"),
      getVoices: () => [{ lang: "zh-CN", default: true }, koreanVoice],
      speak: (value) => calls.push(value),
    },
  };

  assert.equal(speakKorean("커피", environment), true);
  assert.equal(calls[0], "cancel");
  assert.equal(calls[1].text, "커피");
  assert.equal(calls[1].lang, "ko-KR");
  assert.equal(calls[1].voice, koreanVoice);
  assert.equal(calls[1].rate, 0.9);
  assert.equal(calls[1].pitch, 1);
});

test("prefers Korean locale voices and supports underscore locale tags", () => {
  const genericKorean = { lang: "ko", default: true };
  const koreanLocale = { lang: "ko_KR" };
  assert.equal(selectKoreanVoice([{ lang: "zh-CN" }, genericKorean, koreanLocale]), koreanLocale);
  assert.equal(selectKoreanVoice([{ lang: "en-US" }, genericKorean]), genericKorean);
  assert.equal(selectKoreanVoice([{ lang: "en-US", default: true }]), undefined);
});
