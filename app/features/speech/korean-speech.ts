type KoreanVoice = { lang: string; default?: boolean };
type KoreanUtterance = { lang: string; rate: number; pitch: number; voice?: KoreanVoice };
type SpeechEnvironment = {
  speechSynthesis?: {
    cancel: () => void;
    getVoices?: () => KoreanVoice[];
    speak: (utterance: KoreanUtterance) => void;
  };
  SpeechSynthesisUtterance?: new (text: string) => KoreanUtterance;
};

/** 从设备音色中优先选择韩国韩语，其次使用其他韩语音色。 */
export function selectKoreanVoice(voices: KoreanVoice[]): KoreanVoice | undefined {
  const koreanVoices = voices.filter((voice) => voice.lang.replace("_", "-").toLowerCase().startsWith("ko"));
  return koreanVoices.find((voice) => voice.lang.replace("_", "-").toLowerCase() === "ko-kr")
    ?? koreanVoices.find((voice) => voice.default)
    ?? koreanVoices[0];
}

/** 尝试使用当前浏览器朗读韩语；不支持或调用失败时返回false，让练习流程继续。 */
export function speakKorean(text: string, environment = globalThis as unknown as SpeechEnvironment): boolean {
  if (!environment.speechSynthesis || !environment.SpeechSynthesisUtterance) return false;

  try {
    environment.speechSynthesis.cancel();
    const utterance = new environment.SpeechSynthesisUtterance(text);
    const voice = selectKoreanVoice(environment.speechSynthesis.getVoices?.() ?? []);
    utterance.lang = voice?.lang ?? "ko-KR";
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    environment.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
