import type { Lesson, LessonWord } from "../data/lessons/types";
import { summarizeLessonSession, type LessonSession } from "../features/lessons/session";
import { CoffeeSupportDialog } from "./coffee-support-dialog";

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
        <h1>{isMistakeReview ? "复习完成！" : session.groupOnly ? `第 ${session.groupIndex + 1} 组重练完成！` : isGroupComplete ? `第 ${session.groupIndex + 1} 组完成！` : "本关完成！"}</h1>
        <p>{isMistakeReview ? `本轮复习 ${words.length} 个错词` : session.groupOnly ? `已重练第 ${session.groupIndex + 1} 组的 ${wordCount} 个词` : isGroupComplete ? "已完成 5 个词，稍作停顿再继续" : `${lesson.titleKorean} · ${lesson.titleChinese}`}</p>
        <div className="result-stats">
          <div><strong>{wordCount}</strong><span>{isGroupComplete ? "本组词汇" : "学习词汇"}</span></div>
          <div><strong>{accuracy}%</strong><span>{isMistakeReview ? "本轮一次答对率" : "首次听写正确率"}</span></div>
          <div><strong>{mistakeIds.length}</strong><span>{isMistakeReview ? "仍需复习" : "重练词汇"}</span></div>
        </div>
        {mistakeIds.length > 0 && <div className="mistake-list"><span>{isMistakeReview ? "本轮出现错误" : isGroupComplete ? "本组已纠正" : "本关已纠正"}</span><div>{mistakeIds.map((id) => <b key={id}>{words.find((word) => word.id === id)?.korean}</b>)}</div></div>}
        {coffeeTipMilestone !== null && !isGroupComplete && !isMistakeReview && (
          <aside className="coffee-tip" aria-label="学习里程碑与自愿支持">
            <span className="coffee-tip-icon" aria-hidden="true">☕</span>
            <div className="coffee-tip-copy"><strong>已经完成 {completedLessonCount} 关，太棒了！</strong><p>感谢你一直练习！如果 CubeKorean 帮到了你，欢迎自愿请我们喝杯咖啡。</p><button type="button" className="coffee-tip-open" onClick={onOpenCoffeeSupport}>查看支持方式 ↗</button></div>
            <button type="button" onClick={onCloseCoffeeTip} aria-label="关闭这次提示">×</button>
            <button type="button" className="coffee-tip-opt-out" onClick={onOptOutCoffeeTips}>不再提示</button>
          </aside>
        )}
        <button className="primary" onClick={onContinue}>{isGroupComplete ? `继续第 ${session.groupIndex + 2} 组` : isMistakeReview ? "返回错词本" : session.groupOnly ? "返回关卡地图" : nextLesson ? "进入下一关" : "再练一次"} <span>{isMistakeReview || session.groupOnly || nextLesson || isGroupComplete ? "→" : "↻"}</span></button>
        <button className="result-link" onClick={onReturn}>{isMistakeReview ? "返回课程地图" : "返回关卡地图"}</button>
      </section>
      {showCoffeeSupport && <CoffeeSupportDialog onClose={onCloseCoffeeSupport} />}
    </main>
  );
}
