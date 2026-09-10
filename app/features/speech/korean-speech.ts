type KoreanUtterance = { lang: string; rate: number; onend?: () => void; onerror?: () => void };
type SpeechEnvironment = {
  speechSynthesis?: { resume?: () => void; speak: (utterance: KoreanUtterance) => void };
  SpeechSynthesisUtterance?: new (text: string) => KoreanUtterance;
};

let activeUtterance: KoreanUtterance | undefined;

/** 尝试使用当前浏览器朗读韩语；不支持或调用失败时返回false，让练习流程继续。 */
export function speakKorean(text: string, environment = globalThis as unknown as SpeechEnvironment): boolean {
  if (!environment.speechSynthesis || !environment.SpeechSynthesisUtterance) return false;

  try {
    const utterance = new environment.SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.78;
    // Safari和Chrome可能在异步播放开始前回收局部utterance，保留引用直到播放结束。
    activeUtterance = utterance;
    utterance.onend = () => { if (activeUtterance === utterance) activeUtterance = undefined; };
    utterance.onerror = () => { if (activeUtterance === utterance) activeUtterance = undefined; };
    environment.speechSynthesis.resume?.();
    environment.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
