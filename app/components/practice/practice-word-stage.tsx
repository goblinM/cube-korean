import type { RefObject } from "react";
import type { LessonWord } from "../../data/lessons/types";
import { SPELLING_REVEAL_ERROR_LIMIT, shouldRevealSpelling, type LessonSession } from "../../features/lessons/session";
import type { TranslationMode } from "../../features/progress/learning-preferences";
import { playKorean } from "../../features/speech/korean-speech";
import { decomposeHangulToKeystrokes, followsTargetPrefix } from "../../features/spelling/hangul";
import { useI18n } from "../../i18n/i18n-context";

type PracticeWordStageProps = {
  word: LessonWord;
  session: LessonSession;
  answer: string;
  message: string;
  nativeKeyboard: boolean;
  translationMode: TranslationMode;
  manualReveal: boolean;
  showHelp: boolean;
  speechUnavailable: boolean;
  submitting: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onMarkStudied: () => void;
  onToggleHelp: () => void;
  onCloseHelp: () => void;
  onRevealSpelling: () => void;
  onSpeechUnavailable: () => void;
};

/** 展示当前词、IME 输入状态、释义和拼写帮助，不直接修改学习会话。 */
export function PracticeWordStage({ word, session, answer, message, nativeKeyboard, translationMode, manualReveal, showHelp, speechUnavailable, submitting, inputRef, onAnswerChange, onSubmit, onMarkStudied, onToggleHelp, onCloseHelp, onRevealSpelling, onSpeechUnavailable }: PracticeWordStageProps) {
  const { t } = useI18n();
  const isCopyPhase = session.phase === "copy";
  const revealSpelling = manualReveal || shouldRevealSpelling(session);
  const displayLength = Math.max(word.korean.length, answer.length);
  const wordKeystrokes = decomposeHangulToKeystrokes(word.korean).join(" + ");
  const answerFollowsTarget = followsTargetPrefix(answer, word.korean);
  const playCurrentWord = () => void playKorean(word.id, word.korean).then((played) => { if (!played) onSpeechUnavailable(); });

  return (
    <section className="word-stage">
      <div className="emoji-card">{word.emoji}</div>
      <div className="word-actions">
        <button className="sound-button" disabled={speechUnavailable} onClick={(event) => { event.stopPropagation(); playCurrentWord(); }} aria-label={speechUnavailable ? t("word.soundUnavailable") : t("word.playSound")}>▶<span>{speechUnavailable ? t("word.soundUnavailableShort") : t("word.listen")}</span></button>
        <button type="button" className="practice-help-trigger" aria-label={t("word.openHelp")} aria-expanded={showHelp} aria-controls="practice-help" onClick={onToggleHelp}>?</button>
        {showHelp && <aside id="practice-help" className="practice-help" role="dialog" aria-labelledby="practice-help-title">
          <button type="button" className="practice-help-close" onClick={onCloseHelp} aria-label={t("word.closeHelp")}>×</button>
          <small>{isCopyPhase ? t("word.copyGuide") : t("word.listenGuide")}</small>
          <h2 id="practice-help-title">{t("word.how")}</h2>
          <p>{isCopyPhase ? t(nativeKeyboard ? "word.copyInstructionsNative" : "word.copyInstructionsPage") : t("word.listenInstructions")}</p>
          <div className="hangul-compose-guide">
            <strong>{t("word.keyOrder")}</strong><span>{t("word.composeOrder")}</span>
            <div><span>{t("word.leftRight")}</span><b lang="ko">가 = ㄱ + ㅏ</b></div><div><span>{t("word.upDown")}</span><b lang="ko">고 = ㄱ + ㅗ</b></div><div><span>{t("word.withFinal")}</span><b lang="ko">안 = ㅇ + ㅏ + ㄴ</b></div>
            <div className="double-consonant-tip"><span>{t("word.doubleConsonant")}</span><b lang="ko">{nativeKeyboard ? "Shift + E = ㄸ" : "ㄸ = ㄷ + ㄷ"}</b><small>{nativeKeyboard ? t("word.nativeDoubleHelp") : t("word.pageDoubleHelp")}</small></div>
          </div>
          <div className="practice-help-legend"><span><i className="legend-correct" />{t("word.correctColor")}</span><span><i className="legend-wrong" />{t("word.wrongColor")}</span><span><i className="legend-pending" />{t("word.pendingColor")}</span></div>
          <div className="practice-help-actions">{!isCopyPhase && <button type="button" onClick={playCurrentWord}>{t("word.listenAgain")}</button>}<button type="button" className="reveal-action" onClick={onRevealSpelling}>{t("word.showAnswer")}</button><button type="button" onClick={onCloseHelp}>{t("word.understood")}</button></div>
        </aside>}
      </div>
      {speechUnavailable && <p className="speech-notice" role="status">{t("word.speechNotice")}</p>}

      <div className="word-display" lang="ko" aria-label={t("word.currentInput", { answer })}>
        {Array.from({ length: displayLength }).map((_, index) => {
          const typed = answer[index];
          const expected = word.korean[index];
          // IME 未完成的 ㅋ 仍应被识别为 커 的有效前缀，避免组合中间态提前标错。
          const className = typed ? (answerFollowsTarget || typed === expected ? "correct" : "wrong") : "pending";
          return <span className={className} key={index}>{typed || (isCopyPhase ? expected : "＿")}</span>;
        })}
        {!answer && !isCopyPhase && <span className="caret" />}
      </div>

      <input ref={inputRef} className="hidden-input" value={answer} lang="ko" inputMode={nativeKeyboard ? "text" : "none"} readOnly={!nativeKeyboard} autoCapitalize="none" autoComplete="off" onChange={(event) => {
        if (submitting) return;
        if (event.target.value.trim()) onMarkStudied();
        onAnswerChange(event.target.value.replace(/\s/g, ""));
      }} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) onSubmit(); }} aria-label={t("word.inputLabel")} />

      <div className="translation">{translationMode !== "ko-en" && <strong>{word.chinese}</strong>}{translationMode !== "ko-zh" && <span>{word.english}</span>}</div>
      {revealSpelling && <div className="answer-reveal" role="status"><span>{manualReveal ? t("word.answer") : t("word.hintAnswer", { limit: SPELLING_REVEAL_ERROR_LIMIT })}</span><strong lang="ko">{word.korean}</strong><div><small>{t("word.pageOrder")}</small><b lang="ko">{word.korean} = {wordKeystrokes}</b><em>{t("word.retryCorrect")}</em></div></div>}
      <p aria-live="polite" className={`feedback ${answer && !answerFollowsTarget ? "error" : ""}`}>{message || (isCopyPhase ? t(nativeKeyboard ? "word.copyFeedbackNative" : "word.copyFeedbackPage") : session.phase === "retry" ? t("word.retryFeedback") : t("word.listenFeedback"))}</p>
    </section>
  );
}
