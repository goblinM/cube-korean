import { expect, test, type Page } from "@playwright/test";

async function seedAudioPractice(page: Page, rejectAudio = false) {
  await page.addInitScript(({ shouldReject }) => {
    localStorage.clear();
    localStorage.setItem("cubekorean.practice-guide.v1", "seen");
    localStorage.setItem("cubekorean.preferences.v1", JSON.stringify({ version: 1, showEnglish: true, nativeKeyboard: false, muted: false, autoConfirm: false }));
    localStorage.setItem("cubekorean.checkpoint.v1", JSON.stringify({
      version: 1, practiceMode: "lesson", selectedChapterId: "daily-food", selectedLessonId: "cafe-drinks", reviewWordIds: [],
      session: {
        phase: "copy", queue: ["coffee", "water", "milk", "juice", "tea"], position: 0,
        originalWordIds: ["coffee", "water", "milk", "juice", "tea"], mistakeIds: [], firstListenCorrect: 0,
        currentHadError: false, currentErrorCount: 0,
        allWordIds: ["coffee", "water", "milk", "juice", "tea", "green-tea", "black-tea", "cola", "soda", "beer", "wine", "soju", "latte", "americano", "espresso", "hot-chocolate", "ice", "cup", "straw", "bottle"],
        groupIndex: 0, groupSize: 5, completedFirstListenCorrect: 0, completedMistakeIds: [],
      },
    }));
    const state = { audio: [] as string[], speech: [] as Array<{ text: string; lang: string }>, pauses: 0 };
    Object.defineProperty(window, "__cubeAudioState", { value: state, configurable: true });
    class FakeAudio {
      src = ""; preload = ""; playbackRate = 1; currentTime = 0;
      pause() { state.pauses += 1; }
      play() { state.audio.push(`${this.src}|${this.playbackRate}`); return shouldReject ? Promise.reject(new Error("blocked")) : Promise.resolve(); }
    }
    class FakeUtterance {
      lang = ""; rate = 1; onend?: () => void; onerror?: () => void;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "Audio", { value: FakeAudio, configurable: true });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance, configurable: true });
    Object.defineProperty(window, "speechSynthesis", { value: { resume() {}, speak(value: FakeUtterance) { state.speech.push({ text: value.text, lang: value.lang }); } }, configurable: true });
  }, { shouldReject: rejectAudio });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "退出练习" })).toBeVisible();
}

test("自动播放、手动播放和词表连续切换共用静态韩语音频", async ({ page }) => {
  await seedAudioPractice(page);
  const staticAudio = await page.request.get("/audio/ko/coffee.mp3");
  expect(staticAudio.ok()).toBeTruthy();
  expect(staticAudio.headers()["content-type"]).toContain("audio/mpeg");
  expect((await staticAudio.body()).byteLength).toBeGreaterThan(1_000);
  await expect.poll(() => page.evaluate(() => (window as Window & { __cubeAudioState: { audio: string[] } }).__cubeAudioState.audio.length)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "播放韩语发音" }).click();
  await page.getByRole("button", { name: "查看第 1 组词单" }).click();
  await page.getByRole("button", { name: "播放 물 的韩语发音" }).click();
  await page.getByRole("button", { name: "播放 우유 的韩语发音" }).click();
  const state = await page.evaluate(() => (window as Window & { __cubeAudioState: { audio: string[]; pauses: number } }).__cubeAudioState);
  expect(state.audio.some((entry) => entry.endsWith("/audio/ko/coffee.mp3|1.1"))).toBeTruthy();
  expect(state.audio.at(-1)).toMatch(/\/audio\/ko\/milk\.mp3\|1\.1$/);
  expect(state.pauses).toBeGreaterThanOrEqual(2);
});

test("静态音频播放失败时回退到 ko-KR 浏览器语音", async ({ page }) => {
  await seedAudioPractice(page, true);
  await expect.poll(() => page.evaluate(() => (window as Window & { __cubeAudioState: { speech: unknown[] } }).__cubeAudioState.speech.length)).toBeGreaterThan(0);
  const speech = await page.evaluate(() => (window as Window & { __cubeAudioState: { speech: Array<{ text: string; lang: string }> } }).__cubeAudioState.speech.at(-1));
  expect(speech).toEqual({ text: "커피", lang: "ko-KR" });
  await expect(page.getByRole("button", { name: "播放韩语发音" })).toBeEnabled();
});
