import { CHAPTERS, COURSE_WORDS } from "../data/lessons/course";
import { selectWeakWordIds } from "../features/lessons/weak-review";
import type { CourseProgress } from "../features/progress/local-progress";

type MistakeBookPageProps = {
  progress: CourseProgress;
  chapterFilter: string;
  lessonFilter: string;
  onChapterFilterChange: (chapterId: string) => void;
  onLessonFilterChange: (lessonId: string) => void;
  onStartReview: (wordIds: string[]) => void;
  onBack: () => void;
};

/** 展示错词筛选和复习入口，不持有学习会话状态。 */
export function MistakeBookPage({
  progress,
  chapterFilter,
  lessonFilter,
  onChapterFilterChange,
  onLessonFilterChange,
  onStartReview,
  onBack,
}: MistakeBookPageProps) {
  const entries = COURSE_WORDS.filter((entry) => {
    if (!progress.mistakes[entry.word.id]) return false;
    if (chapterFilter !== "all" && entry.chapterId !== chapterFilter) return false;
    return lessonFilter === "all" || entry.lessonId === lessonFilter;
  });
  const weakWordIds = selectWeakWordIds(COURSE_WORDS, progress);
  const filterLessons = chapterFilter === "all"
    ? CHAPTERS.flatMap((chapter) => chapter.lessons)
    : CHAPTERS.find((chapter) => chapter.id === chapterFilter)?.lessons ?? [];

  return (
    <main className="mistake-page">
      <header className="subpage-header">
        <button className="back-button" onClick={onBack}>← 返回课程</button>
        <div className="brand"><span>ㅋ</span> CubeKorean</div>
      </header>
      <section className="mistake-shell">
        <div className="mistake-heading">
          <div><div className="eyebrow">REVIEW BOOK</div><h1>错词本</h1><p>连续两次专项复习一次答对后，单词会自动移出错词本。</p></div>
          <strong>{Object.keys(progress.mistakes).length}<small>待掌握词</small></strong>
        </div>
        <section className="smart-review-card">
          <span>⚡</span>
          <div><small>SMART REVIEW</small><h2>智能弱项复习</h2><p>{weakWordIds.length ? `已从全部错词中选出最需要巩固的 ${weakWordIds.length} 个词。` : "完成听音拼写并产生错词后，这里会自动生成短时复习。"}</p></div>
          <button disabled={!weakWordIds.length} onClick={() => onStartReview(weakWordIds)}>开始复习 <b>→</b></button>
        </section>
        <div className="mistake-filters">
          <label>大关卡<select value={chapterFilter} onChange={(event) => onChapterFilterChange(event.target.value)}><option value="all">全部</option>{CHAPTERS.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.titleChinese}</option>)}</select></label>
          <label>小关卡<select value={lessonFilter} onChange={(event) => onLessonFilterChange(event.target.value)}><option value="all">全部</option>{filterLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.titleChinese}</option>)}</select></label>
          <button className="review-button" disabled={!entries.length} onClick={() => onStartReview(entries.map((entry) => entry.word.id))}>复习当前 {entries.length} 词 →</button>
        </div>
        {entries.length ? <div className="mistake-grid">{entries.map((entry) => {
          const mistake = progress.mistakes[entry.word.id];
          return <article key={entry.word.id}><span>{entry.word.emoji}</span><div><b lang="ko">{entry.word.korean}</b><p>{entry.word.chinese} · {entry.word.english}</p><small>{entry.chapterTitle} / {entry.lessonTitle} · 错误 {mistake.errorCount} 次 · 已正确复习 {mistake.correctReviews}/2</small></div></article>;
        })}</div> : <div className="empty-mistakes"><span>✓</span><h2>当前没有错词</h2><p>完成听音拼写后，答错的词会自动出现在这里。</p></div>}
      </section>
    </main>
  );
}
