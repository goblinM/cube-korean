import type { ChangeEvent, RefObject } from "react";
import type { summarizeLearningActivity } from "../features/progress/learning-activity";
import type { LearningStats } from "../features/progress/learning-stats";
import type { CourseProgress } from "../features/progress/local-progress";
import { CoffeeSupportDialog } from "./coffee-support-dialog";
import { CHAPTERS } from "../data/lessons/course";
import { chapterTitle, lessonTitle } from "../i18n/course-titles";
import { useI18n } from "../i18n/i18n-context";
import { LanguageSelector } from "./language-selector";

type LearningDataPageProps = {
  learningStats: LearningStats;
  activitySummary: ReturnType<typeof summarizeLearningActivity>;
  progress: CourseProgress;
  dailyGoal: number;
  totalLessonCount: number;
  backupMessage: string;
  resetArmed: boolean;
  backupInputRef: RefObject<HTMLInputElement | null>;
  showCoffeeSupport: boolean;
  onBack: () => void;
  onDailyGoalChange: (goal: number) => void;
  onOpenCoffeeSupport: () => void;
  onCloseCoffeeSupport: () => void;
  onDownloadBackup: () => void;
  onImportBackup: (event: ChangeEvent<HTMLInputElement>) => void;
  onResetLearningData: () => void;
};

/** 展示学习统计、备份和本机数据操作，具体读写仍由页面控制器执行。 */
export function LearningDataPage({
  learningStats,
  activitySummary,
  progress,
  dailyGoal,
  totalLessonCount,
  backupMessage,
  resetArmed,
  backupInputRef,
  showCoffeeSupport,
  onBack,
  onDailyGoalChange,
  onOpenCoffeeSupport,
  onCloseCoffeeSupport,
  onDownloadBackup,
  onImportBackup,
  onResetLearningData,
}: LearningDataPageProps) {
  const { locale, t } = useI18n();
  const weeklyMax = Math.max(dailyGoal, ...activitySummary.days.map((day) => day.sessions));
  const masteryTotal = Math.max(1, learningStats.completedLessons);
  const completionPercent = Math.round((learningStats.completedLessons / totalLessonCount) * 100);

  return (
    <main className="data-page">
      <header className="subpage-header">
        <button className="back-button" onClick={onBack}>← {t("common.backCourse")}</button>
        <div className="subpage-header-actions"><LanguageSelector /><div className="brand"><span>ㅋ</span> CubeKorean</div></div>
      </header>
      <section className="data-shell">
        <div className="eyebrow">LEARNING DATA</div>
        <h1>{t("data.title")}</h1>
        <p className="data-intro">{t("data.intro")}</p>
        <div className="data-stats">
          <div><strong>{learningStats.learnedWords}</strong><span>{t("data.learnedWords")}</span></div>
          <div><strong>{learningStats.totalAttempts}</strong><span>{t("data.attempts")}</span></div>
          <div><strong>{learningStats.averageAccuracy}%</strong><span>{t("data.accuracy")}</span></div>
          <div><strong>{Object.keys(progress.mistakes).length}</strong><span>{t("data.pending")}</span></div>
          <div><strong>{activitySummary.streak}</strong><span>{t("data.streak")}</span></div>
        </div>
        <section className="insight-card weekly-card">
          <div className="section-heading"><div><small>LAST 7 DAYS</small><h2>{t("data.last7")}</h2></div><label>{t("data.dailyGoal")}<select value={dailyGoal} onChange={(event) => onDailyGoalChange(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((goal) => <option key={goal} value={goal}>{t("data.rounds", { count: goal })}</option>)}</select></label></div>
          <div className="weekly-chart">{activitySummary.days.map((day) => <div key={day.key} className={day.isToday ? "today" : ""}><span><i style={{ height: `${Math.max(day.sessions ? 12 : 3, (day.sessions / weeklyMax) * 100)}%` }} /></span><b>{day.sessions}</b><small>{day.label}</small></div>)}</div>
          <p className="goal-copy">{t("data.today")} <strong>{activitySummary.today.sessions}</strong> / {t("data.rounds", { count: dailyGoal })}{activitySummary.today.sessions >= dailyGoal ? t("data.goalMet") : ""}</p>
        </section>
        <section className="insight-card">
          <div className="section-heading"><div><small>MASTERY</small><h2>{t("data.mastery")}</h2></div><strong>{completionPercent}%<span>{t("data.totalCourse")}</span></strong></div>
          <div className="mastery-track" aria-label={t("data.masteryAria", learningStats.mastery)}><i className="mastered" style={{ width: `${(learningStats.mastery.mastered / masteryTotal) * 100}%` }} /><i className="familiar" style={{ width: `${(learningStats.mastery.familiar / masteryTotal) * 100}%` }} /><i className="learning" style={{ width: `${(learningStats.mastery.learning / masteryTotal) * 100}%` }} /></div>
          <div className="mastery-legend"><span><i className="mastered" />{t("data.mastered")} {learningStats.mastery.mastered}</span><span><i className="familiar" />{t("data.familiar")} {learningStats.mastery.familiar}</span><span><i className="learning" />{t("data.learning")} {learningStats.mastery.learning}</span></div>
        </section>
        <section className="insight-card">
          <div className="section-heading"><div><small>TOPICS</small><h2>{t("data.topicProgress")}</h2></div><span>{learningStats.completedLessons} / {totalLessonCount} {t("data.levelUnit")}</span></div>
          <div className="chapter-progress-list">{learningStats.chapters.map((item) => { const chapter = CHAPTERS.find((candidate) => candidate.id === item.chapterId); return <div className="chapter-progress-item" key={item.chapterId}><div><strong>{chapter ? chapterTitle(chapter, locale) : item.titleChinese}</strong><span>{item.completedLessons} / {item.totalLessons}</span></div><div className="chapter-progress-track"><i style={{ width: `${item.percent}%` }} /></div></div>; })}</div>
        </section>
        <section className="insight-card">
          <div className="section-heading"><div><small>RECENT</small><h2>{t("data.recent")}</h2></div></div>
          {learningStats.recent.length ? <div className="recent-list">{learningStats.recent.map((item) => { const chapter = CHAPTERS.find((candidate) => candidate.id === item.chapterId); const lesson = chapter?.lessons.find((candidate) => candidate.id === item.lessonId); return <div key={`${item.completedAt}-${item.lessonId}`}><span><b>{lesson ? lessonTitle(lesson, locale) : item.lessonTitle}</b><small>{chapter ? chapterTitle(chapter, locale) : item.chapterTitle} · {new Date(item.completedAt).toLocaleDateString(locale)}</small></span><strong>{item.accuracy}%</strong></div>; })}</div> : <div className="empty-recent">{t("data.emptyRecent")}</div>}
        </section>
        <section className="insight-card coffee-entry">
          <div><small>SUPPORT</small><h2>{t("data.supportTitle")}</h2><p>{t("data.supportCopy")}</p></div>
          <button type="button" onClick={onOpenCoffeeSupport}>{t("data.supportButton")} <span aria-hidden="true">↗</span></button>
        </section>
        <div className="data-section-title"><small>DATA</small><h2>{t("data.backupTitle")}</h2></div>
        <div className="data-actions">
          <article><span className="data-icon">↓</span><div><h2>{t("data.downloadTitle")}</h2><p>{t("data.downloadCopy")}</p></div><button onClick={onDownloadBackup}>{t("data.download")}</button></article>
          <article><span className="data-icon">↑</span><div><h2>{t("data.restoreTitle")}</h2><p>{t("data.restoreCopy")}</p></div><button onClick={() => backupInputRef.current?.click()}>{t("data.choose")}</button><input ref={backupInputRef} className="backup-file-input" type="file" accept="application/json,.json" onChange={onImportBackup} /></article>
          <article className="danger-zone"><span className="data-icon">×</span><div><h2>{t("data.resetTitle")}</h2><p>{t("data.resetCopy")}</p></div><button onClick={onResetLearningData}>{resetArmed ? t("data.confirmReset") : t("data.reset")}</button></article>
        </div>
        <p className={`backup-message ${resetArmed ? "warning" : ""}`} role="status">{backupMessage}</p>
      </section>
      {showCoffeeSupport && <CoffeeSupportDialog onClose={onCloseCoffeeSupport} />}
    </main>
  );
}
