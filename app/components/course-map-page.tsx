import { CHAPTERS } from "../data/lessons/course";
import type { CourseProgress } from "../features/progress/local-progress";
import { isLessonUnlocked, isReviewDue } from "../features/progress/local-progress";
import { chapterTitle, lessonTitle } from "../i18n/course-titles";
import { useI18n } from "../i18n/i18n-context";
import { LanguageSelector } from "./language-selector";

const LESSON_ICONS: Record<string, string[]> = {
  "daily-food": ["☕", "🍳", "🍚", "🍎", "🥬", "🍰", "🍽️", "🌶️", "🍲", "🥩"],
  "daily-travel": ["🚌", "🧭", "🚦", "🚄", "✈️", "🏨", "📸", "🎒", "🎫", "🚑"],
  "hotel-stay": ["🏨", "📅", "🛎️", "🛏️", "🛋️", "🚿", "🧹", "⚠️", "💳", "🧳"],
  tourism: ["🏙️", "🌿", "🏛️", "🏯", "🌳", "📸", "🗺️", "🎡", "🎁", "🧭"],
  shopping: ["🏬", "👕", "👟", "💳", "📦", "🛒", "🛋️", "🧴", "↩️", "🛍️"],
  hospital: ["📝", "🫀", "🤒", "🩻", "💉", "💊", "🚑", "🛏️", "❤️", "🏥"],
  work: ["🏢", "👔", "📄", "🤝", "🗓️", "💰", "👥", "📊", "✅", "💼"],
  fitness: ["🏃", "⚽", "🏋️", "🏃‍♀️", "🤸", "🏆", "🌳", "🥗", "🩹", "💪"],
  movies: ["🎥", "📺", "🎭", "🎬", "⭐", "🍿", "👍", "🎵", "📡", "🎞️"],
  social: ["👫", "🎈", "🏠", "🎨", "😊", "🙏", "🎊", "💬", "☕", "🎉"],
};

type CourseMapPageProps = {
  selectedChapterId: string;
  selectedLessonId: string;
  progress: CourseProgress;
  checkpointReady: boolean;
  preferencesReady: boolean;
  todayWords: number;
  onSelectChapter: (chapterId: string) => void;
  onSelectLesson: (lessonId: string) => void;
  onStartLesson: () => void;
  onOpenMistakeBook: () => void;
  onOpenDataCenter: () => void;
};

/** 展示课程地图与入口；课程选择和开练行为由页面控制器负责。 */
export function CourseMapPage({
  selectedChapterId,
  selectedLessonId,
  progress,
  checkpointReady,
  preferencesReady,
  todayWords,
  onSelectChapter,
  onSelectLesson,
  onStartLesson,
  onOpenMistakeBook,
  onOpenDataCenter,
}: CourseMapPageProps) {
  const { locale, t } = useI18n();
  const chapter = CHAPTERS.find((candidate) => candidate.id === selectedChapterId) ?? CHAPTERS[0];
  const chapterIndex = CHAPTERS.findIndex((candidate) => candidate.id === chapter.id);
  const lesson = chapter.lessons.find((candidate) => candidate.id === selectedLessonId) ?? chapter.lessons[0];

  return (
    <main className="map-page">
      <header className="brand-row">
        <div className="brand" aria-label={t("home.aria")}><span>ㅋ</span> CubeKorean</div>
        <div className="header-actions">
          <LanguageSelector disabled={!preferencesReady} />
          <button className="mistake-link" disabled={!checkpointReady} onClick={onOpenMistakeBook}>{t("home.mistakes")} <b>{Object.keys(progress.mistakes).length}</b></button>
          <span className="daily-status" aria-label={`${t("home.today")} ${todayWords} ${t("home.wordUnit")}`}><small>{t("home.today")}</small><strong>{todayWords}<em>{t("home.wordUnit")}</em></strong></span>
          <button className="settings-button" disabled={!checkpointReady} onClick={onOpenDataCenter} aria-label={t("home.settings")} title={t("home.settings")}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 2h4l.45 2.2 1.5.65 1.9-1.23 2.83 2.83-1.23 1.9.65 1.5L22 10v4l-2.2.45-.65 1.5 1.23 1.9-2.83 2.83-1.9-1.23-1.5.65L14 22h-4l-.45-2.2-1.5-.65-1.9 1.23-2.83-2.83 1.23-1.9-.65-1.5L2 14v-4l2.2-.45.65-1.5-1.23-1.9 2.83-2.83 1.9 1.23 1.5-.65L10 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">TODAY&apos;S KOREAN</div>
          <h1>{t("home.heroTitle").split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
          <p>{t("home.heroLead")}</p>
          <p>{t("home.heroBody")}</p>
        </div>

        <div className="lesson-map">
          <div className="chapter-switcher" aria-label={t("home.selectChapter")}>
            <button className="chapter-arrow" disabled={!checkpointReady || chapterIndex <= 0} onClick={() => onSelectChapter(CHAPTERS[chapterIndex - 1].id)} aria-label={t("home.previousChapter")}>←</button>
            <div className="chapter-current"><span>{LESSON_ICONS[chapter.id]?.[0] ?? "✦"}</span><div><small>{t("home.topic")} {chapterIndex + 1} / {CHAPTERS.length}</small><strong>{chapterTitle(chapter, locale)}</strong><em>{chapter.titleKorean}</em></div></div>
            <select value={chapter.id} disabled={!checkpointReady} onChange={(event) => onSelectChapter(event.target.value)} aria-label={t("home.selectTopic")}>{CHAPTERS.map((item, index) => <option value={item.id} key={item.id}>{t("home.topic")} {index + 1} · {chapterTitle(item, locale)}</option>)}</select>
            <button className="chapter-arrow" disabled={!checkpointReady || chapterIndex >= CHAPTERS.length - 1} onClick={() => onSelectChapter(CHAPTERS[chapterIndex + 1].id)} aria-label={t("home.nextChapter")}>→</button>
          </div>
          <div className="cube-wrap" aria-hidden="true">
            <div className="cube">
              <div className="face front"><b>{LESSON_ICONS[chapter.id]?.[0] ?? "✦"}</b><span>{chapter.titleKorean.split(" ")[0]}</span></div>
              <div className="face right"><b>{LESSON_ICONS[chapter.id]?.[1] ?? "✦"}</b><span>{chapterTitle(chapter, locale)}</span></div>
              <div className="face top"><b>✦</b></div>
            </div>
            <div className="cube-shadow" />
          </div>
          <div className="level-meta"><span>{chapterTitle(chapter, locale)} · {t("home.level", { count: chapter.lessons.findIndex((item) => item.id === lesson.id) + 1 })}</span><h2>{lessonTitle(lesson, locale)}</h2><p>{lesson.titleKorean} · {t("home.practiceMeta")}</p></div>
          <div className="stage-row">
            {chapter.lessons.map((item, index) => {
              const unlocked = isLessonUnlocked(chapter.lessons.map((entry) => entry.id), item.id, progress);
              const completed = progress.lessons[item.id];
              const selected = item.id === lesson.id;
              return (
                <button className={`stage ${selected ? "active" : ""} ${completed ? "completed" : ""}`} disabled={!checkpointReady || !unlocked} key={item.id} onClick={() => onSelectLesson(item.id)} aria-label={`${index + 1}. ${lessonTitle(item, locale)}${unlocked ? "" : `, ${t("home.locked")}`}`}>
                  <span>{completed ? "✓" : unlocked ? LESSON_ICONS[chapter.id][index] : "🔒"}</span>
                  <small>{completed ? (isReviewDue(completed) ? t("home.reviewDue") : completed.mastery === "mastered" ? t("home.mastered") : `${completed.bestAccuracy}%`) : unlocked ? lessonTitle(item, locale) : t("home.locked")}</small>
                </button>
              );
            })}
          </div>
          <button className="primary" disabled={!checkpointReady} onClick={onStartLesson}>{progress.lessons[lesson.id] ? t("home.practiceAgain") : t("home.start")} <span>→</span></button>
        </div>
      </section>
    </main>
  );
}
