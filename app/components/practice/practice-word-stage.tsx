import type { RefObject } from "react";
import type { LessonWord } from "../../data/lessons/types";
import { SPELLING_REVEAL_ERROR_LIMIT, shouldRevealSpelling, type LessonSession } from "../../features/lessons/session";
import type { TranslationMode } from "../../features/progress/learning-preferences";
import { playKorean } from "../../features/speech/korean-speech";
import { decomposeHangulToKeystrokes, followsTargetPrefix } from "../../features/spelling/hangul";

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
        <button className="sound-button" disabled={speechUnavailable} onClick={(event) => { event.stopPropagation(); playCurrentWord(); }} aria-label={speechUnavailable ? "韩语发音不可用" : "播放韩语发音"}>▶<span>{speechUnavailable ? "发音不可用" : "听发音"}</span></button>
        <button type="button" className="practice-help-trigger" aria-label="打开不会写提示" aria-expanded={showHelp} aria-controls="practice-help" onClick={onToggleHelp}>?</button>
        {showHelp && <aside id="practice-help" className="practice-help" role="dialog" aria-labelledby="practice-help-title">
          <button type="button" className="practice-help-close" onClick={onCloseHelp} aria-label="关闭练习说明">×</button>
          <small>{isCopyPhase ? "看词拼写说明" : "听音拼写说明"}</small>
          <h2 id="practice-help-title">怎么练？</h2>
          <p>{isCopyPhase ? `上方灰色韩文就是目标答案。请按初声、中声、收音的顺序${nativeKeyboard ? "使用系统韩语键盘" : "点击下面的页面键盘"}，不需要输入罗马音。` : "先听韩语发音，再按初声、中声、收音的顺序拼写。完全不记得时可以直接查看韩文答案，不必故意答错。"}</p>
          <div className="hangul-compose-guide">
            <strong>韩文按键顺序</strong><span>初声 → 中声 →（收音）</span>
            <div><span>左右</span><b lang="ko">가 = ㄱ + ㅏ</b></div><div><span>上下</span><b lang="ko">고 = ㄱ + ㅗ</b></div><div><span>有收音</span><b lang="ko">안 = ㅇ + ㅏ + ㄴ</b></div>
            <div className="double-consonant-tip"><span>双辅音</span><b lang="ko">{nativeKeyboard ? "Shift + E = ㄸ" : "ㄸ = ㄷ + ㄷ"}</b><small>{nativeKeyboard ? "两套式键盘按住 Shift；其他双辅音同理" : "连续点两次；ㄲ、ㅃ、ㅆ、ㅉ 同理"}</small></div>
          </div>
          <div className="practice-help-legend"><span><i className="legend-correct" />黑色：正确</span><span><i className="legend-wrong" />红色：需修改</span><span><i className="legend-pending" />灰色：未输入</span></div>
          <div className="practice-help-actions">{!isCopyPhase && <button type="button" onClick={playCurrentWord}>再听一次</button>}<button type="button" className="reveal-action" onClick={onRevealSpelling}>显示韩文答案</button><button type="button" onClick={onCloseHelp}>我知道了</button></div>
        </aside>}
      </div>
      {speechUnavailable && <p className="speech-notice" role="status">当前浏览器无法朗读韩语，仍可继续看词拼写和听写练习。</p>}

      <div className="word-display" lang="ko" aria-label={`当前输入 ${answer}`}>
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
      }} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) onSubmit(); }} aria-label="输入韩语拼写" />

      <div className="translation">{translationMode !== "ko-en" && <strong>{word.chinese}</strong>}{translationMode !== "ko-zh" && <span>{word.english}</span>}</div>
      {revealSpelling && <div className="answer-reveal" role="status"><span>{manualReveal ? "韩文答案" : `提示答案 · ${SPELLING_REVEAL_ERROR_LIMIT}/${SPELLING_REVEAL_ERROR_LIMIT}`}</span><strong lang="ko">{word.korean}</strong><div><small>页面键盘顺序</small><b lang="ko">{word.korean} = {wordKeystrokes}</b><em>重新拼写正确后继续</em></div></div>}
      <p aria-live="polite" className={`feedback ${answer && !answerFollowsTarget ? "error" : ""}`}>{message || (isCopyPhase ? `照着灰色韩文，用${nativeKeyboard ? "系统韩语键盘" : "下方键盘"}重新拼写（不是写读音）` : session.phase === "retry" ? "重新写对这个听写错词；不会时可点右侧提示" : "根据发音拼写韩文；不会时可点右侧提示")}</p>
    </section>
  );
}
