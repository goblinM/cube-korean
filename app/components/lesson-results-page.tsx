import type { Lesson, LessonWord } from "../data/lessons/types";
import { summarizeLessonSession, type LessonSession } from "../features/lessons/session";
import { CoffeeSupportDialog } from "./coffee-support-dialog";
import { lessonTitle } from "../i18n/course-titles";
import { useI18n } from "../i18n/i18n-context";

type LessonResultsPageProps = {
  practiceMode: "lesson" | "mistakes";
  session: LessonSession;
  words: LessonWord[];
  lesson: Lesson;
  nextLesson: Lesson | undefined;
  hasNextGroup: boolean;
  completedLessonCount: number;
  coffeeTipMilestone: number | null;
  showCoffeeSupport: boolean;
  onContinue: () => void;
  onReturn: () => void;
  onOpenCoffeeSupport: () => void;
  onCloseCoffeeSupport: () => void;
  onCloseCoffeeTip: () => void;
  onOptOutCoffeeTips: () => void;
};

/** 根据已完成会话展示结算信息，后续导航由页面控制器决定。 */
export function LessonResultsPage({
  practiceMode,
  session,
  words,
  lesson,
  nextLesson,
  hasNextGroup,
  completedLessonCount,
  coffeeTipMilestone,
  showCoffeeSupport,
  onContinue,
  onReturn,
  onOpenCoffeeSupport,
  onCloseCoffeeSupport,
  onCloseCoffeeTip,
  onOptOutCoffeeTips,
}: LessonResultsPageProps) {
  const { locale, t } = useI18n();
  const isMistakeReview = practiceMode === "mistakes";
  const summary = summarizeLessonSession(session);
  const isGroupComplete = !isMistakeReview && hasNextGroup;
  const mistakeIds = isGroupComplete ? session.mistakeIds : summary.mistakeIds;
  const wordCount = isGroupComplete ? session.originalWordIds.length : summary.wordCount;
  const accuracy = isMistakeReview
    ? Math.round(((words.length - session.mistakeIds.length) / words.length) * 100)
    : isGroupComplete
      ? Math.round((session.firstListenCorrect / session.originalWordIds.length) * 100)
      : Math.round((summary.firstListenCorrect / summary.wordCount) * 100);

  return (
    <main className="results-page">
      <section className="results-card">
        <div className="result-mark">✓</div>
        <div className="eyebrow">{isMistakeReview ? "REVIEW COMPLETE" : session.groupOnly || isGroupComplete ? `GROUP ${session.groupIndex + 1} COMPLETE` : "LESSON COMPLETE"}</div>
        <h1>{isMistakeReview ? t("results.reviewComplete") : session.groupOnly ? t("results.groupReplayComplete", { group: session.groupIndex + 1 }) : isGroupComplete ? t("results.groupComplete", { group: session.groupIndex + 1 }) : t("results.lessonComplete")}</h1>
        <p>{isMistakeReview ? t("results.reviewSummary", { count: words.length }) : session.groupOnly ? t("results.groupReplaySummary", { group: session.groupIndex + 1, count: wordCount }) : isGroupComplete ? t("results.groupSummary") : `${lesson.titleKorean} · ${lessonTitle(lesson, locale)}`}</p>
        <div className="result-stats">
          <div><strong>{wordCount}</strong><span>{isGroupComplete ? t("results.groupWords") : t("results.learnedWords")}</span></div>
          <div><strong>{accuracy}%</strong><span>{isMistakeReview ? t("results.reviewAccuracy") : t("results.listenAccuracy")}</span></div>
          <div><strong>{mistakeIds.length}</strong><span>{isMistakeReview ? t("results.needReview") : t("results.retryWords")}</span></div>
        </div>
        {mistakeIds.length > 0 && <div className="mistake-list"><span>{isMistakeReview ? t("results.errors") : isGroupComplete ? t("results.groupCorrected") : t("results.lessonCorrected")}</span><div>{mistakeIds.map((id) => <b key={id}>{words.find((word) => word.id === id)?.korean}</b>)}</div></div>}
        {coffeeTipMilestone !== null && !isGroupComplete && !isMistakeReview && (
          <aside className="coffee-tip" aria-label={t("results.coffeeAria")}>
            <span className="coffee-tip-icon" aria-hidden="true">☕</span>
            <div className="coffee-tip-copy"><strong>{t("results.milestone", { count: completedLessonCount })}</strong><p>{t("results.coffeeCopy")}</p><button type="button" className="coffee-tip-open" onClick={onOpenCoffeeSupport}>{t("results.support")}</button></div>
            <button type="button" onClick={onCloseCoffeeTip} aria-label={t("results.closeTip")}>×</button>
            <button type="button" className="coffee-tip-opt-out" onClick={onOptOutCoffeeTips}>{t("results.optOut")}</button>
          </aside>
        )}
        <button className="primary" onClick={onContinue}>{isGroupComplete ? t("results.nextGroup", { group: session.groupIndex + 2 }) : isMistakeReview ? t("results.backMistakes") : session.groupOnly ? t("results.backMap") : nextLesson ? t("results.nextLesson") : t("results.again")} <span>{isMistakeReview || session.groupOnly || nextLesson || isGroupComplete ? "→" : "↻"}</span></button>
        <button className="result-link" onClick={onReturn}>{isMistakeReview ? t("results.backCourseMap") : t("results.backMap")}</button>
      </section>
      {showCoffeeSupport && <CoffeeSupportDialog onClose={onCloseCoffeeSupport} />}
    </main>
  );
}
