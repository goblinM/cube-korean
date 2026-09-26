import { CHAPTERS, COURSE_WORDS } from "../data/lessons/course";
import { selectWeakWordIds } from "../features/lessons/weak-review";
import type { CourseProgress } from "../features/progress/local-progress";
import { chapterTitle, lessonTitle } from "../i18n/course-titles";
import { useI18n } from "../i18n/i18n-context";

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
  const { locale, t } = useI18n();
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
        <button className="back-button" onClick={onBack}>← {t("common.backCourse")}</button>
        <div className="brand"><span>ㅋ</span> CubeKorean</div>
      </header>
      <section className="mistake-shell">
        <div className="mistake-heading">
          <div><div className="eyebrow">REVIEW BOOK</div><h1>{t("mistakes.title")}</h1><p>{t("mistakes.description")}</p></div>
          <strong>{Object.keys(progress.mistakes).length}<small>{t("mistakes.pending")}</small></strong>
        </div>
        <section className="smart-review-card">
          <span>⚡</span>
          <div><small>SMART REVIEW</small><h2>{t("mistakes.smartTitle")}</h2><p>{weakWordIds.length ? t("mistakes.smartReady", { count: weakWordIds.length }) : t("mistakes.smartEmpty")}</p></div>
          <button disabled={!weakWordIds.length} onClick={() => onStartReview(weakWordIds)}>{t("mistakes.start")} <b>→</b></button>
        </section>
        <div className="mistake-filters">
          <label>{t("mistakes.chapter")}<select value={chapterFilter} onChange={(event) => onChapterFilterChange(event.target.value)}><option value="all">{t("common.all")}</option>{CHAPTERS.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapterTitle(chapter, locale)}</option>)}</select></label>
          <label>{t("mistakes.lesson")}<select value={lessonFilter} onChange={(event) => onLessonFilterChange(event.target.value)}><option value="all">{t("common.all")}</option>{filterLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lessonTitle(lesson, locale)}</option>)}</select></label>
          <button className="review-button" disabled={!entries.length} onClick={() => onStartReview(entries.map((entry) => entry.word.id))}>{t("mistakes.reviewCurrent", { count: entries.length })}</button>
        </div>
        {entries.length ? <div className="mistake-grid">{entries.map((entry) => {
          const mistake = progress.mistakes[entry.word.id];
          const sourceChapter = CHAPTERS.find((item) => item.id === entry.chapterId);
          const sourceLesson = sourceChapter?.lessons.find((item) => item.id === entry.lessonId);
          return <article key={entry.word.id}><span>{entry.word.emoji}</span><div><b lang="ko">{entry.word.korean}</b><p>{locale === "en" ? entry.word.english : `${entry.word.chinese} · ${entry.word.english}`}</p><small>{sourceChapter ? chapterTitle(sourceChapter, locale) : entry.chapterTitle} / {sourceLesson ? lessonTitle(sourceLesson, locale) : entry.lessonTitle} · {t("mistakes.errorMeta", { errors: mistake.errorCount, reviews: mistake.correctReviews })}</small></div></article>;
        })}</div> : <div className="empty-mistakes"><span>✓</span><h2>{t("mistakes.emptyTitle")}</h2><p>{t("mistakes.emptyDescription")}</p></div>}
      </section>
    </main>
  );
}
