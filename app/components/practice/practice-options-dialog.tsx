import type { RefObject } from "react";
import { useI18n } from "../../i18n/i18n-context";

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
  const { t } = useI18n();
  if (!open) return null;

  return (
    <>
      <button type="button" className="practice-options-backdrop" aria-label={t("options.close")} onClick={onClose} />
      <section id="practice-options-dialog" className="practice-options-dialog" role="dialog" aria-modal="true" aria-labelledby="practice-options-title">
        <header><div><small>LEARNING MODE</small><h2 id="practice-options-title">{t("options.title")}</h2></div><button ref={closeRef} type="button" aria-label={t("options.close")} onClick={onClose}>×</button></header>
        <div className="practice-options-fields">
          <div className="practice-options-field"><strong>{t("options.method")}</strong><div className="practice-options-choices" role="group" aria-label={t("options.selectMethod")}>
            <button type="button" aria-pressed={selectedStartPhase === "copy"} onClick={() => onStartPhaseChange("copy")}>{t("options.copyListen")}</button>
            <button type="button" aria-pressed={selectedStartPhase === "listen"} onClick={() => onStartPhaseChange("listen")}>{t("options.directListen")}</button>
          </div></div>
          {lessonCompleted && <div className="practice-options-field"><strong>{t("options.range")}</strong><div className="practice-options-choices" role="group" aria-label={t("options.selectRange")}>
            <button type="button" aria-pressed={selectedReplayGroupIndex === null} onClick={() => onReplayGroupChange(null)}>{t("options.whole", { count: lessonWordCount })}</button>
            {Array.from({ length: Math.ceil(lessonWordCount / 5) }, (_, index) => <button type="button" key={index} aria-pressed={selectedReplayGroupIndex === index} onClick={() => onReplayGroupChange(index)}>{t("options.group", { group: index + 1 })}</button>)}
          </div></div>}
        </div>
        <p>{selectedStartPhase === "listen" ? t("options.directHelp") : t("options.defaultHelp")}</p>
        {(startPhaseChanged || rangeChanged) && <p className="practice-options-warning">{rangeChanged ? t("options.rangeWarning") : t("options.modeWarning", { group: groupIndex + 1 })}</p>}
        <div className="practice-options-actions"><button type="button" onClick={onClose}>{t("common.cancel")}</button><button type="button" onClick={onApply}>{t("options.apply")}</button></div>
      </section>
    </>
  );
}
