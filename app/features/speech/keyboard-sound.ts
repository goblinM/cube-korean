export type KeyboardSoundKind = "key" | "delete";

type KeyboardAudio = {
  src: string;
  preload: string;
  volume: number;
  currentTime: number;
  pause: () => void;
  play: () => Promise<void> | void;
};

type KeyboardSoundEnvironment = { Audio?: new () => KeyboardAudio };

export const KEYBOARD_SOUND_URLS: Record<KeyboardSoundKind, string> = {
  key: "/audio/ui/key-press.wav",
  delete: "/audio/ui/backspace-press.wav",
};

const POOL_SIZE = 4;
const pools: Record<KeyboardSoundKind, KeyboardAudio[]> = { key: [], delete: [] };
const cursors: Record<KeyboardSoundKind, number> = { key: 0, delete: 0 };
let activeAudioConstructor: KeyboardSoundEnvironment["Audio"];

/** 播放本地CC0键盘采样；小型音频池允许快速输入时保留自然重叠。 */
export function playKeyboardSound(
  kind: KeyboardSoundKind = "key",
  environment = globalThis as unknown as KeyboardSoundEnvironment,
): boolean {
  if (!environment.Audio) return false;
  try {
    if (activeAudioConstructor !== environment.Audio) {
      pools.key.length = 0;
      pools.delete.length = 0;
      cursors.key = 0;
      cursors.delete = 0;
      activeAudioConstructor = environment.Audio;
    }

    const pool = pools[kind];
    let audio: KeyboardAudio;
    if (pool.length < POOL_SIZE) {
      audio = new environment.Audio();
      audio.preload = "auto";
      audio.volume = 0.85;
      audio.src = KEYBOARD_SOUND_URLS[kind];
      pool.push(audio);
    } else {
      audio = pool[cursors[kind] % POOL_SIZE];
      audio.pause();
      audio.currentTime = 0;
    }
    cursors[kind] += 1;
    void Promise.resolve(audio.play()).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}
