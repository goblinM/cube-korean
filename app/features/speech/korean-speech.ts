type KoreanUtterance = { lang: string; rate: number; onend?: () => void; onerror?: () => void };
type KoreanAudio = {
  src: string;
  preload: string;
  playbackRate: number;
  currentTime: number;
  pause: () => void;
  play: () => Promise<void> | void;
};
type SpeechEnvironment = {
  Audio?: new () => KoreanAudio;
  speechSynthesis?: { resume?: () => void; speak: (utterance: KoreanUtterance) => void };
  SpeechSynthesisUtterance?: new (text: string) => KoreanUtterance;
};

let activeUtterance: KoreanUtterance | undefined;
let activeAudio: KoreanAudio | undefined;
let activeAudioConstructor: SpeechEnvironment["Audio"];
let playbackRequestId = 0;
export const KOREAN_AUDIO_PLAYBACK_RATE = 1.1;

/** 将稳定词条ID映射为随站点发布的共享韩语音频地址。 */
export function koreanAudioUrl(wordId: string): string {
  return `/audio/ko/${encodeURIComponent(wordId)}.mp3`;
}

/** 尝试使用当前浏览器朗读韩语；不支持或调用失败时返回false，让练习流程继续。 */
export function speakKorean(text: string, environment = globalThis as unknown as SpeechEnvironment): boolean {
  if (!environment.speechSynthesis || !environment.SpeechSynthesisUtterance) return false;

  try {
    const utterance = new environment.SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.9;
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

/** 优先播放预生成MP3；资源缺失或被浏览器拒绝时尝试现有系统韩语语音。 */
export async function playKorean(
  wordId: string,
  text: string,
  environment = globalThis as unknown as SpeechEnvironment,
): Promise<boolean> {
  const requestId = ++playbackRequestId;

  if (!environment.Audio) return speakKorean(text, environment);

  try {
    if (!activeAudio || activeAudioConstructor !== environment.Audio) {
      activeAudio = new environment.Audio();
      activeAudioConstructor = environment.Audio;
    } else {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    activeAudio.preload = "auto";
    activeAudio.playbackRate = KOREAN_AUDIO_PLAYBACK_RATE;
    activeAudio.src = koreanAudioUrl(wordId);
    await Promise.resolve(activeAudio.play());
    return true;
  } catch {
    // 快速切词时，旧播放请求失败不应触发过期单词的备用发音。
    if (requestId !== playbackRequestId) return true;
    return speakKorean(text, environment);
  }
}
