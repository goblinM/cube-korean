import type { RefObject } from "react";
import type { TranslationMode } from "../../features/progress/learning-preferences";
import { useI18n } from "../../i18n/i18n-context";

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
  keySound: boolean;
  muted: boolean;
  submitting: boolean;
  answer: string;
  translationMode: TranslationMode;
  inputRef: RefObject<HTMLInputElement | null>;
  onToggleMuted: () => void;
  onTranslationModeChange: (mode: TranslationMode) => void;
  onToggleAutoConfirm: () => void;
  onToggleKeySound: () => void;
  onResetAnswer: () => void;
  onTypeKey: (key: string) => void;
  onDeleteKey: () => void;
  onToggleNativeKeyboard: (useNativeKeyboard: boolean) => void;
  onSubmit: () => void;
};

/** 展示页面韩语键盘或电脑键位参考，并转发用户输入意图。 */
export function HangulKeyboard({ nativeKeyboard, autoConfirm, keySound, muted, submitting, answer, translationMode, inputRef, onToggleMuted, onTranslationModeChange, onToggleAutoConfirm, onToggleKeySound, onResetAnswer, onTypeKey, onDeleteKey, onToggleNativeKeyboard, onSubmit }: HangulKeyboardProps) {
  const { t } = useI18n();
  return (
    <section className="keyboard-area">
      <div className="utility-row">
        <button onClick={onToggleMuted}>{muted ? "🔇" : "🔊"} {t("keyboard.autoSound")}</button>
        <select className="translation-mode-select" aria-label={t("keyboard.translationMode")} value={translationMode} onChange={(event) => onTranslationModeChange(event.target.value as TranslationMode)}><option value="ko-zh-en">{t("keyboard.koZhEn")}</option><option value="ko-zh">{t("keyboard.koZh")}</option><option value="ko-en">{t("keyboard.koEn")}</option></select>
        {!nativeKeyboard && <button aria-pressed={keySound} onClick={onToggleKeySound}>{keySound ? "🔉" : "🔇"} {t("keyboard.keySound")}</button>}
        {!nativeKeyboard && <button aria-pressed={autoConfirm} onClick={onToggleAutoConfirm}>✓ {autoConfirm ? t("keyboard.autoConfirm") : t("keyboard.manualConfirm")}</button>}
        <button onClick={onResetAnswer}>↻ {t("keyboard.restart")}</button>
      </div>
      {!nativeKeyboard && <div className="keyboard">{KEYS.map((row, rowIndex) => <div className="key-row" key={rowIndex}>{row.map((key) => <button disabled={submitting} key={key} onClick={() => onTypeKey(key)}>{key}</button>)}{rowIndex === 2 && <button disabled={submitting} className="delete" onClick={onDeleteKey} aria-label={t("keyboard.delete")}>⌫</button>}</div>)}</div>}
      {nativeKeyboard && <div className="physical-keyboard-guide" role="group" aria-label={t("keyboard.physicalGuide")}>
        <div className="physical-keyboard-heading"><strong>{t("keyboard.physicalTitle")}</strong><span>{t("keyboard.twoSet")}</span></div>
        <div className="physical-keyboard-rows">{KEYS.map((row, rowIndex) => <div className="physical-key-row" key={rowIndex}>{row.map((hangul, keyIndex) => {
          const latin = PHYSICAL_KEY_ROWS[rowIndex][keyIndex];
          const shifted = SHIFTED_PHYSICAL_KEYS[latin];
          return <kbd className="physical-key" key={latin} aria-label={`${t("keyboard.mapping", { latin, hangul })}${shifted ? t("keyboard.shiftMapping", { latin, hangul: shifted }) : ""}`}><span>{latin}</span><strong lang="ko">{hangul}</strong>{shifted && <small lang="ko">⇧{shifted}</small>}</kbd>;
        })}</div>)}</div>
        <p>{t("keyboard.physicalHelp")}</p>
      </div>}
      <div className="bottom-actions">
        <button className="native" onClick={() => {
          const useNativeKeyboard = !nativeKeyboard;
          onToggleNativeKeyboard(useNativeKeyboard);
          if (useNativeKeyboard) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
          else inputRef.current?.blur();
        }}>{nativeKeyboard ? t("keyboard.showPage") : t("keyboard.useNative")}</button>
        <button className="check" disabled={!answer || submitting} onClick={onSubmit}>{t("keyboard.check")} <span>↵</span></button>
      </div>
    </section>
  );
}
