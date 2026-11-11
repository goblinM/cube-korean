import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { composeHangul } from "../../features/spelling/compose-hangul";
import { decomposeHangulToKeystrokes, followsTargetPrefix } from "../../features/spelling/hangul";
import { COURSE_WORDS } from "../../data/lessons/course";
import { drawRound } from "../../features/typing/round";
import { useI18n } from "../../i18n/i18n-context";
import { JamoKeys, KEYS, PHYSICAL_KEY_ROWS, SHIFTED_PHYSICAL_KEYS } from "./jamo-keys";

type Props = {
  initialWords: string[];
  total: number;
  hints: boolean;
  onToggleHints: () => void;
  onWord: () => void;
  onExit: () => void;
};

const physicalKeys = Object.fromEntries(KEYS.flatMap((row, i) => row.map((key, j) => [PHYSICAL_KEY_ROWS[i][j], key])));

export function TypingPractice({ initialWords, total, hints, onToggleHints, onWord, onExit }: Props) {
  const { t } = useI18n();
  const [words, setWords] = useState(initialWords);
  const [round, setRound] = useState(1);
  const [done, setDone] = useState(0);
  const [keys, setKeys] = useState("");
  const [text, setText] = useState("");
  const [native, setNative] = useState(false);
  const [composing, setComposing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const nextRound = useRef<HTMLButtonElement>(null);
  const target = words[done];
  const word = COURSE_WORDS.find(entry => entry.word.korean === target)?.word;
  const answer = native ? text : composeHangul(keys, target);
  const valid = !!target && followsTargetPrefix(answer, target);
  const typed = decomposeHangulToKeystrokes(answer);
  const next = hints && valid ? decomposeHangulToKeystrokes(target)[typed.length] : undefined;

  useEffect(() => {
    if (target) input.current?.focus({ preventScroll: true });
    else nextRound.current?.focus({ preventScroll: true });
  }, [target, native]);

  useEffect(() => {
    if (!target || composing || answer !== target) return;
    // Let the browser deliver its final composition/input events before clearing the field.
    const timer = window.setTimeout(() => {
      onWord();
      setDone(n => n + 1);
      setKeys("");
      setText("");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [answer, target, composing, onWord]);

  function physicalInput(event: KeyboardEvent<HTMLElement>) {
    if (native || !target || event.ctrlKey || event.metaKey || event.altKey || event.nativeEvent.isComposing) return;
    const latin = event.code.startsWith("Key") ? event.code.slice(3) : "";
    const key = (event.shiftKey && SHIFTED_PHYSICAL_KEYS[latin]) || physicalKeys[latin];
    if (!key && event.key !== "Backspace") return;
    event.preventDefault();
    if (answer !== target) setKeys(value => key ? value + key : value.slice(0, -1));
  }

  return <main className="practice-page typing-page">
    <header className="practice-header">
      <button className="icon-button" aria-label={t("header.exit")} onClick={onExit}>×</button>
      <div className="progress-track" role="progressbar" aria-label={t("header.progress")} aria-valuemin={0} aria-valuemax={words.length} aria-valuenow={done}>
        <span style={{ width: (100 * done / words.length) + "%" }} />
      </div>
      <strong className="counter">{t("typing.count", { done, size: words.length })}</strong>
    </header>
    {target ? <>
      <div className="practice-mode-row"><div className="mode-pill"><span>{String(round).padStart(2, "0")}</span>{t("typing.mode")} · {t("typing.round", { round })}</div></div>
      <section className="word-stage typing-stage">
        <div className="emoji-card" aria-hidden="true">{word?.emoji}</div>
        <h1 lang="ko" aria-live="polite">{target}</h1>
        <div className="translation">
          <strong lang="zh-CN">{word?.chinese}</strong>
          <span lang="en">{word?.english}</span>
        </div>
        <input ref={input} onKeyDown={physicalInput} lang="ko" aria-label={t("typing.answer")} value={answer} readOnly={!native}
          inputMode={native ? "text" : "none"} placeholder={t("typing.answer")} autoCapitalize="none" autoComplete="off" spellCheck={false}
          aria-invalid={!composing && !valid} onChange={event => setText(event.target.value)}
          onCompositionStart={() => setComposing(true)} onCompositionEnd={event => { setText(event.currentTarget.value); setComposing(false); }} />
        <small className={valid || composing ? "feedback" : "feedback error"} role="status">{!composing && !valid ? t("typing.backspace") : next ? t("typing.nextKey", { key: next }) : ""}</small>
      </section>
      <section className="keyboard-area">
        <div className="utility-row">
          <button aria-pressed={hints} onClick={() => { onToggleHints(); input.current?.focus({ preventScroll: true }); }}>{t("typing.hints")}</button>
          <button onClick={() => {
            if (native) setKeys(decomposeHangulToKeystrokes(text).join(""));
            else setText(answer);
            setComposing(false);
            setNative(!native);
          }}>{t(native ? "keyboard.showPage" : "keyboard.useNative")}</button>
        </div>
        {!native && <JamoKeys latin next={next} disabled={answer === target} deleteLabel={t("keyboard.delete")}
          onKey={key => { setKeys(value => value + key); input.current?.focus({ preventScroll: true }); }}
          onDelete={() => { setKeys(value => value.slice(0, -1)); input.current?.focus({ preventScroll: true }); }} />}
      </section>
    </> : <section className="typing-stage typing-results">
      <div className="emoji-card" aria-hidden="true">✓</div>
      <h1>{t("typing.done", { round })}</h1>
      <p>{t("typing.total", { size: words.length, total })}</p>
      <button ref={nextRound} className="primary" onClick={() => {
        setWords(drawRound(words.length, words)); setDone(0); setRound(n => n + 1);
      }}>{t("typing.next", { size: words.length })}</button>
      <button className="result-link" onClick={onExit}>{t("typing.end")}</button>
    </section>}
  </main>;
}
