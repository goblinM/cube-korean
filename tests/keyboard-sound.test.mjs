import assert from "node:assert/strict";
import test from "node:test";
import { KEYBOARD_SOUND_URLS, playKeyboardSound } from "../app/features/speech/keyboard-sound.ts";

test("plays local CC0 key and backspace samples at the configured volume", () => {
  const played = [];
  class FakeAudio {
    src = "";
    preload = "";
    volume = 0;
    currentTime = 0;
    pause() {}
    play() {
      played.push({ src: this.src, preload: this.preload, volume: this.volume });
      return Promise.resolve();
    }
  }
  const environment = { Audio: FakeAudio };
  assert.equal(playKeyboardSound("key", environment), true);
  assert.equal(playKeyboardSound("delete", environment), true);
  assert.deepEqual(played, [
    { src: KEYBOARD_SOUND_URLS.key, preload: "auto", volume: 0.65 },
    { src: KEYBOARD_SOUND_URLS.delete, preload: "auto", volume: 0.65 },
  ]);
});

test("returns false when the browser does not support audio", () => {
  assert.equal(playKeyboardSound("key", {}), false);
});
