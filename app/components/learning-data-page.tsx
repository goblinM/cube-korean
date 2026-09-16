import type { ChangeEvent, RefObject } from "react";
import type { summarizeLearningActivity } from "../features/progress/learning-activity";
import type { LearningStats } from "../features/progress/learning-stats";
import type { CourseProgress } from "../features/progress/local-progress";
import { CoffeeSupportDialog } from "./coffee-support-dialog";

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
  const weeklyMax = Math.max(dailyGoal, ...activitySummary.days.map((day) => day.sessions));
  const masteryTotal = Math.max(1, learningStats.completedLessons);
  const completionPercent = Math.round((learningStats.completedLessons / totalLessonCount) * 100);

  return (
    <main className="data-page">
      <header className="subpage-header">
        <button className="back-button" onClick={onBack}>← 返回课程</button>
        <div className="brand"><span>ㅋ</span> CubeKorean</div>
      </header>
      <section className="data-shell">
        <div className="eyebrow">LEARNING DATA</div>
        <h1>学习数据</h1>
        <p className="data-intro">学习记录保存在当前浏览器。定期下载备份，可以在清理浏览器数据或更换设备后恢复。</p>
        <div className="data-stats">
          <div><strong>{learningStats.learnedWords}</strong><span>累计学习词</span></div>
          <div><strong>{learningStats.totalAttempts}</strong><span>累计练习次数</span></div>
          <div><strong>{learningStats.averageAccuracy}%</strong><span>最近平均正确率</span></div>
          <div><strong>{Object.keys(progress.mistakes).length}</strong><span>待复习词</span></div>
          <div><strong>{activitySummary.streak}</strong><span>连续学习天数</span></div>
        </div>
        <section className="insight-card weekly-card">
          <div className="section-heading"><div><small>LAST 7 DAYS</small><h2>近七日学习</h2></div><label>每日目标<select value={dailyGoal} onChange={(event) => onDailyGoalChange(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((goal) => <option key={goal} value={goal}>{goal} 轮</option>)}</select></label></div>
          <div className="weekly-chart">{activitySummary.days.map((day) => <div key={day.key} className={day.isToday ? "today" : ""}><span><i style={{ height: `${Math.max(day.sessions ? 12 : 3, (day.sessions / weeklyMax) * 100)}%` }} /></span><b>{day.sessions}</b><small>{day.label}</small></div>)}</div>
          <p className="goal-copy">今日已完成 <strong>{activitySummary.today.sessions}</strong> / {dailyGoal} 轮{activitySummary.today.sessions >= dailyGoal ? "，目标达成 ✓" : ""}</p>
        </section>
        <section className="insight-card">
          <div className="section-heading"><div><small>MASTERY</small><h2>掌握度分布</h2></div><strong>{completionPercent}%<span>总课程</span></strong></div>
          <div className="mastery-track" aria-label={`已掌握 ${learningStats.mastery.mastered} 关，熟悉 ${learningStats.mastery.familiar} 关，学习中 ${learningStats.mastery.learning} 关`}><i className="mastered" style={{ width: `${(learningStats.mastery.mastered / masteryTotal) * 100}%` }} /><i className="familiar" style={{ width: `${(learningStats.mastery.familiar / masteryTotal) * 100}%` }} /><i className="learning" style={{ width: `${(learningStats.mastery.learning / masteryTotal) * 100}%` }} /></div>
          <div className="mastery-legend"><span><i className="mastered" />已掌握 {learningStats.mastery.mastered}</span><span><i className="familiar" />熟悉 {learningStats.mastery.familiar}</span><span><i className="learning" />学习中 {learningStats.mastery.learning}</span></div>
        </section>
        <section className="insight-card">
          <div className="section-heading"><div><small>TOPICS</small><h2>主题进度</h2></div><span>{learningStats.completedLessons} / {totalLessonCount} 关</span></div>
          <div className="chapter-progress-list">{learningStats.chapters.map((item) => <div className="chapter-progress-item" key={item.chapterId}><div><strong>{item.titleChinese}</strong><span>{item.completedLessons} / {item.totalLessons}</span></div><div className="chapter-progress-track"><i style={{ width: `${item.percent}%` }} /></div></div>)}</div>
        </section>
        <section className="insight-card">
          <div className="section-heading"><div><small>RECENT</small><h2>最近学习</h2></div></div>
          {learningStats.recent.length ? <div className="recent-list">{learningStats.recent.map((item) => <div key={`${item.completedAt}-${item.lessonTitle}`}><span><b>{item.lessonTitle}</b><small>{item.chapterTitle} · {new Date(item.completedAt).toLocaleDateString("zh-CN")}</small></span><strong>{item.accuracy}%</strong></div>)}</div> : <div className="empty-recent">完成第一关后，这里会显示最近学习记录。</div>}
        </section>
        <section className="insight-card coffee-entry">
          <div><small>SUPPORT</small><h2>☕ 支持 CubeKorean</h2><p>喜欢这里的韩语拼写练习？可以自愿请我们喝杯咖啡。所有学习功能都保持免费。</p></div>
          <button type="button" onClick={onOpenCoffeeSupport}>查看支持方式 <span aria-hidden="true">↗</span></button>
        </section>
        <div className="data-section-title"><small>DATA</small><h2>备份与恢复</h2></div>
        <div className="data-actions">
          <article><span className="data-icon">↓</span><div><h2>下载学习备份</h2><p>保存通关记录、正确率、错词、学习位置和练习偏好。</p></div><button onClick={onDownloadBackup}>下载备份</button></article>
          <article><span className="data-icon">↑</span><div><h2>恢复学习备份</h2><p>选择 CubeKorean 导出的 JSON 文件，验证成功后替换本机数据。</p></div><button onClick={() => backupInputRef.current?.click()}>选择备份</button><input ref={backupInputRef} className="backup-file-input" type="file" accept="application/json,.json" onChange={onImportBackup} /></article>
          <article className="danger-zone"><span className="data-icon">×</span><div><h2>重置本机数据</h2><p>清空学习进度、错词、偏好和未完成练习，此操作无法撤销。</p></div><button onClick={onResetLearningData}>{resetArmed ? "确认清空" : "重置数据"}</button></article>
        </div>
        <p className={`backup-message ${resetArmed ? "warning" : ""}`} role="status">{backupMessage}</p>
      </section>
      {showCoffeeSupport && <CoffeeSupportDialog onClose={onCloseCoffeeSupport} />}
    </main>
  );
}
