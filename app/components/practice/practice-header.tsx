import type { RefObject } from "react";
import type { LessonSession } from "../../features/lessons/session";

type PracticeHeaderProps = {
  session: LessonSession;
  groupTotal: number;
  practiceMode: "lesson" | "mistakes";
  submitting: boolean;
  optionsOpen: boolean;
  optionsTriggerRef: RefObject<HTMLButtonElement | null>;
  onExit: () => void;
  onOpenOptions: () => void;
};

/** 展示练习进度和当前阶段，并提供退出及练习设置入口。 */
export function PracticeHeader({ session, groupTotal, practiceMode, submitting, optionsOpen, optionsTriggerRef, onExit, onOpenOptions }: PracticeHeaderProps) {
  const progressPercent = ((session.position + 1) / session.queue.length) * 100;
  const phaseLabel = session.phase === "copy" ? "看词拼写" : session.phase === "listen" ? "听音拼写" : "错词重练";
  const phaseNumber = session.phase === "copy" ? "01" : session.phase === "listen" ? "02" : "03";

  return (
    <>
      <header className="practice-header">
        <button className="icon-button" onClick={onExit} aria-label="退出练习">×</button>
        <div className="progress-track" role="progressbar" aria-label="本轮学习进度" aria-valuemin={0} aria-valuemax={session.queue.length} aria-valuenow={session.position + 1}><span style={{ width: `${progressPercent}%` }} /></div>
        <div className="counter">{session.groupSize && <span>第 {session.groupIndex + 1}/{groupTotal} 组 · </span>}<b>{session.position + 1}</b> / {session.queue.length}</div>
      </header>
      <div className="practice-mode-row">
        <div className="mode-pill"><span>{phaseNumber}</span>{phaseLabel}</div>
        {practiceMode === "lesson" && <button ref={optionsTriggerRef} type="button" className="practice-options-trigger" disabled={submitting} aria-haspopup="dialog" aria-expanded={optionsOpen} aria-controls="practice-options-dialog" onClick={onOpenOptions}>调整练习 <span aria-hidden="true">⌄</span></button>}
      </div>
    </>
  );
}
