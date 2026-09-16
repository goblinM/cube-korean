import type { RefObject } from "react";

type PracticeOptionsDialogProps = {
  open: boolean;
  closeRef: RefObject<HTMLButtonElement | null>;
  selectedStartPhase: "copy" | "listen";
  selectedReplayGroupIndex: number | null;
  lessonCompleted: boolean;
  lessonWordCount: number;
  groupIndex: number;
  startPhaseChanged: boolean;
  rangeChanged: boolean;
  onStartPhaseChange: (phase: "copy" | "listen") => void;
  onReplayGroupChange: (groupIndex: number | null) => void;
  onClose: () => void;
  onApply: () => void;
};

/** 展示练习方式和重练范围选项，实际重启会话由页面控制器完成。 */
export function PracticeOptionsDialog({ open, closeRef, selectedStartPhase, selectedReplayGroupIndex, lessonCompleted, lessonWordCount, groupIndex, startPhaseChanged, rangeChanged, onStartPhaseChange, onReplayGroupChange, onClose, onApply }: PracticeOptionsDialogProps) {
  if (!open) return null;

  return (
    <>
      <button type="button" className="practice-options-backdrop" aria-label="关闭练习设置" onClick={onClose} />
      <section id="practice-options-dialog" className="practice-options-dialog" role="dialog" aria-modal="true" aria-labelledby="practice-options-title">
        <header><div><small>LEARNING MODE</small><h2 id="practice-options-title">调整本关练习</h2></div><button ref={closeRef} type="button" aria-label="关闭练习设置" onClick={onClose}>×</button></header>
        <div className="practice-options-fields">
          <div className="practice-options-field"><strong>练习方式</strong><div className="practice-options-choices" role="group" aria-label="选择练习方式">
            <button type="button" aria-pressed={selectedStartPhase === "copy"} onClick={() => onStartPhaseChange("copy")}>看词＋听写</button>
            <button type="button" aria-pressed={selectedStartPhase === "listen"} onClick={() => onStartPhaseChange("listen")}>直接听写</button>
          </div></div>
          {lessonCompleted && <div className="practice-options-field"><strong>重练范围</strong><div className="practice-options-choices" role="group" aria-label="选择重练分组">
            <button type="button" aria-pressed={selectedReplayGroupIndex === null} onClick={() => onReplayGroupChange(null)}>整关 · {lessonWordCount}词</button>
            {Array.from({ length: Math.ceil(lessonWordCount / 5) }, (_, index) => <button type="button" key={index} aria-pressed={selectedReplayGroupIndex === index} onClick={() => onReplayGroupChange(index)}>第{index + 1}组 · 5词</button>)}
          </div></div>}
        </div>
        <p>{selectedStartPhase === "listen" ? "直接听写会跳过看词阶段，按发音和释义拼写。" : "默认先看词拼写，再进入听音默写。"}</p>
        {(startPhaseChanged || rangeChanged) && <p className="practice-options-warning">{rangeChanged ? "更改重练范围后，会从所选范围的第 1 个词开始；当前未完成的位置会被替换。" : `切换方式后，会从当前第 ${groupIndex + 1} 组的第 1 个词重新开始；前面已完成的组和整关进度会保留。`}</p>}
        <div className="practice-options-actions"><button type="button" onClick={onClose}>取消</button><button type="button" onClick={onApply}>应用选择</button></div>
      </section>
    </>
  );
}
