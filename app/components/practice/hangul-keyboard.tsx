import type { RefObject } from "react";
import type { TranslationMode } from "../../features/progress/learning-preferences";

const KEYS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];
const PHYSICAL_KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const SHIFTED_PHYSICAL_KEYS: Record<string, string> = { Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ", O: "ㅒ", P: "ㅖ" };

type HangulKeyboardProps = {
  nativeKeyboard: boolean;
  autoConfirm: boolean;
  muted: boolean;
  submitting: boolean;
  answer: string;
  translationMode: TranslationMode;
  inputRef: RefObject<HTMLInputElement | null>;
  onToggleMuted: () => void;
  onTranslationModeChange: (mode: TranslationMode) => void;
  onToggleAutoConfirm: () => void;
  onResetAnswer: () => void;
  onTypeKey: (key: string) => void;
  onDeleteKey: () => void;
  onToggleNativeKeyboard: (useNativeKeyboard: boolean) => void;
  onSubmit: () => void;
};

/** 展示页面韩语键盘或电脑键位参考，并转发用户输入意图。 */
export function HangulKeyboard({ nativeKeyboard, autoConfirm, muted, submitting, answer, translationMode, inputRef, onToggleMuted, onTranslationModeChange, onToggleAutoConfirm, onResetAnswer, onTypeKey, onDeleteKey, onToggleNativeKeyboard, onSubmit }: HangulKeyboardProps) {
  return (
    <section className="keyboard-area">
      <div className="utility-row">
        <button onClick={onToggleMuted}>{muted ? "🔇" : "🔊"} 自动发音</button>
        <select className="translation-mode-select" aria-label="释义显示模式" value={translationMode} onChange={(event) => onTranslationModeChange(event.target.value as TranslationMode)}><option value="ko-zh-en">韩中英</option><option value="ko-zh">韩中</option><option value="ko-en">韩英</option></select>
        {!nativeKeyboard && <button aria-pressed={autoConfirm} onClick={onToggleAutoConfirm}>✓ {autoConfirm ? "拼对即过" : "手动确认"}</button>}
        <button onClick={onResetAnswer}>↻ 重来</button>
      </div>
      {!nativeKeyboard && <div className="keyboard">{KEYS.map((row, rowIndex) => <div className="key-row" key={rowIndex}>{row.map((key) => <button disabled={submitting} key={key} onClick={() => onTypeKey(key)}>{key}</button>)}{rowIndex === 2 && <button disabled={submitting} className="delete" onClick={onDeleteKey} aria-label="删除一个韩文字母">⌫</button>}</div>)}</div>}
      {nativeKeyboard && <div className="physical-keyboard-guide" role="group" aria-label="电脑韩语键位参考">
        <div className="physical-keyboard-heading"><strong>电脑键位参考</strong><span>韩语两套式 · 2-Set</span></div>
        <div className="physical-keyboard-rows">{KEYS.map((row, rowIndex) => <div className="physical-key-row" key={rowIndex}>{row.map((hangul, keyIndex) => {
          const latin = PHYSICAL_KEY_ROWS[rowIndex][keyIndex];
          const shifted = SHIFTED_PHYSICAL_KEYS[latin];
          return <kbd className="physical-key" key={latin} aria-label={`${latin} 对应 ${hangul}${shifted ? `；Shift 加 ${latin} 对应 ${shifted}` : ""}`}><span>{latin}</span><strong lang="ko">{hangul}</strong>{shifted && <small lang="ko">⇧{shifted}</small>}</kbd>;
        })}</div>)}</div>
        <p>先切换电脑输入法至韩语两套式，再按实体键盘输入。复合元音依次按键；双辅音按 Shift + 对应字母。</p>
      </div>}
      <div className="bottom-actions">
        <button className="native" onClick={() => {
          const useNativeKeyboard = !nativeKeyboard;
          onToggleNativeKeyboard(useNativeKeyboard);
          if (useNativeKeyboard) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
          else inputRef.current?.blur();
        }}>{nativeKeyboard ? "显示页面键盘" : "使用系统韩语键盘"}</button>
        <button className="check" disabled={!answer || submitting} onClick={onSubmit}>检查答案 <span>↵</span></button>
      </div>
    </section>
  );
}
