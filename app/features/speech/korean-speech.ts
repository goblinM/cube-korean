type KoreanUtterance = { lang: string; rate: number };
type SpeechEnvironment = {
  speechSynthesis?: { cancel: () => void; speak: (utterance: KoreanUtterance) => void };
  SpeechSynthesisUtterance?: new (text: string) => KoreanUtterance;
};

/** 尝试使用当前浏览器朗读韩语；不支持或调用失败时返回false，让练习流程继续。 */
export function speakKorean(text: string, environment = globalThis as unknown as SpeechEnvironment): boolean {
  if (!environment.speechSynthesis || !environment.SpeechSynthesisUtterance) return false;

  try {
    environment.speechSynthesis.cancel();
    const utterance = new environment.SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.78;
    environment.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
