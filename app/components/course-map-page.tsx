import { CHAPTERS } from "../data/lessons/course";
import type { CourseProgress } from "../features/progress/local-progress";
import { isLessonUnlocked, isReviewDue } from "../features/progress/local-progress";

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
  todayWords,
  onSelectChapter,
  onSelectLesson,
  onStartLesson,
  onOpenMistakeBook,
  onOpenDataCenter,
}: CourseMapPageProps) {
  const chapter = CHAPTERS.find((candidate) => candidate.id === selectedChapterId) ?? CHAPTERS[0];
  const chapterIndex = CHAPTERS.findIndex((candidate) => candidate.id === chapter.id);
  const lesson = chapter.lessons.find((candidate) => candidate.id === selectedLessonId) ?? chapter.lessons[0];

  return (
    <main className="map-page">
      <header className="brand-row">
        <div className="brand" aria-label="CubeKorean 首页"><span>ㅋ</span> CubeKorean</div>
        <div className="header-actions">
          <button className="mistake-link" disabled={!checkpointReady} onClick={onOpenMistakeBook}>错词本 <b>{Object.keys(progress.mistakes).length}</b></button>
          <span className="daily-status" aria-label={`今日学习 ${todayWords} 词`}><small>今日学习</small><strong>{todayWords}<em>词</em></strong></span>
          <button className="settings-button" disabled={!checkpointReady} onClick={onOpenDataCenter} aria-label="打开学习数据与设置" title="学习数据与设置"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 2h4l.45 2.2 1.5.65 1.9-1.23 2.83 2.83-1.23 1.9.65 1.5L22 10v4l-2.2.45-.65 1.5 1.23 1.9-2.83 2.83-1.9-1.23-1.5.65L14 22h-4l-.45-2.2-1.5-.65-1.9 1.23-2.83-2.83 1.23-1.9-.65-1.5L2 14v-4l2.2-.45.65-1.5-1.23-1.9 2.83-2.83 1.9 1.23 1.5-.65L10 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></svg></button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">TODAY&apos;S KOREAN</div>
          <h1>听见生活<br />写出韩语</h1>
          <p>不从字母表重新开始，直接进入真实生活词汇。</p>
          <p>用看词拼写和听音默写，把每一个韩语单词真正记下来。</p>
        </div>

        <div className="lesson-map">
          <div className="chapter-switcher" aria-label="选择大关卡">
            <button className="chapter-arrow" disabled={!checkpointReady || chapterIndex <= 0} onClick={() => onSelectChapter(CHAPTERS[chapterIndex - 1].id)} aria-label="上一个大关卡">←</button>
            <div className="chapter-current"><span>{LESSON_ICONS[chapter.id]?.[0] ?? "✦"}</span><div><small>主题 {chapterIndex + 1} / {CHAPTERS.length}</small><strong>{chapter.titleChinese}</strong><em>{chapter.titleKorean}</em></div></div>
            <select value={chapter.id} disabled={!checkpointReady} onChange={(event) => onSelectChapter(event.target.value)} aria-label="选择生活主题">{CHAPTERS.map((item, index) => <option value={item.id} key={item.id}>主题 {index + 1} · {item.titleChinese}</option>)}</select>
            <button className="chapter-arrow" disabled={!checkpointReady || chapterIndex >= CHAPTERS.length - 1} onClick={() => onSelectChapter(CHAPTERS[chapterIndex + 1].id)} aria-label="下一个大关卡">→</button>
          </div>
          <div className="cube-wrap" aria-hidden="true">
            <div className="cube">
              <div className="face front"><b>{LESSON_ICONS[chapter.id]?.[0] ?? "✦"}</b><span>{chapter.titleKorean.split(" ")[0]}</span></div>
              <div className="face right"><b>{LESSON_ICONS[chapter.id]?.[1] ?? "✦"}</b><span>{chapter.titleChinese}</span></div>
              <div className="face top"><b>✦</b></div>
            </div>
            <div className="cube-shadow" />
          </div>
          <div className="level-meta"><span>{chapter.titleChinese} · 第 {chapter.lessons.findIndex((item) => item.id === lesson.id) + 1} 关</span><h2>{lesson.titleChinese}</h2><p>{lesson.titleKorean} · 20词 · 4组练习</p></div>
          <div className="stage-row">
            {chapter.lessons.map((item, index) => {
              const unlocked = isLessonUnlocked(chapter.lessons.map((entry) => entry.id), item.id, progress);
              const completed = progress.lessons[item.id];
              const selected = item.id === lesson.id;
              return (
                <button className={`stage ${selected ? "active" : ""} ${completed ? "completed" : ""}`} disabled={!checkpointReady || !unlocked} key={item.id} onClick={() => onSelectLesson(item.id)} aria-label={`${index + 1}. ${item.titleChinese}${unlocked ? "" : "，未解锁"}`}>
                  <span>{completed ? "✓" : unlocked ? LESSON_ICONS[chapter.id][index] : "🔒"}</span>
                  <small>{completed ? (isReviewDue(completed) ? "待复习" : completed.mastery === "mastered" ? "已掌握" : `${completed.bestAccuracy}%`) : unlocked ? item.titleChinese : "未解锁"}</small>
                </button>
              );
            })}
          </div>
          <button className="primary" disabled={!checkpointReady} onClick={onStartLesson}>{progress.lessons[lesson.id] ? "再次练习" : "开始本关"} <span>→</span></button>
        </div>
      </section>
    </main>
  );
}
