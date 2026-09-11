"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CHAPTERS, COURSE_WORDS } from "./data/lessons/course";
import {
  advanceLessonGroup,
  canResumeLessonSession,
  createLessonSession,
  createReviewSession,
  hasNextLessonGroup,
  SPELLING_REVEAL_ERROR_LIMIT,
  shouldRevealSpelling,
  submitLessonAnswer,
  summarizeLessonSession,
} from "./features/lessons/session";
import { countDueLessons, findChapterContinueLessonId, recommendLesson } from "./features/lessons/recommendation";
import { markPracticeGuideSeen, shouldShowPracticeGuide } from "./features/lessons/practice-guide";
import { selectWeakWordIds } from "./features/lessons/weak-review";
import {
  createEmptyProgress,
  isReviewDue,
  isLessonUnlocked,
  readProgress,
  recordLessonMistake,
  recordMistakeReview,
  recordLessonResult,
  writeProgress,
} from "./features/progress/local-progress";
import { readLearningLocation, writeLearningLocation } from "./features/progress/learning-location";
import { clearLearningCheckpoint, readLearningCheckpoint, writeLearningCheckpoint } from "./features/progress/learning-checkpoint";
import { readLearningPreferences, writeLearningPreferences } from "./features/progress/learning-preferences";
import { clearAllLearningData, createLearningBackup, restoreLearningBackup } from "./features/progress/learning-backup";
import { calculateLearningStats } from "./features/progress/learning-stats";
import {
  createEmptyLearningActivity,
  readDailyGoal,
  readLearningActivity,
  recordLearningActivity,
  summarizeLearningActivity,
  writeDailyGoal,
} from "./features/progress/learning-activity";
import { playKorean } from "./features/speech/korean-speech";
import { composeHangul } from "./features/spelling/compose-hangul";
import { followsTargetPrefix, isExactSpelling } from "./features/spelling/hangul";

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
const TOTAL_LESSON_COUNT = CHAPTERS.reduce((total, item) => total + item.lessons.length, 0);

const KEYS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

export default function Home() {
  const [started, setStarted] = useState(false);
  const [showMistakeBook, setShowMistakeBook] = useState(false);
  const [showDataCenter, setShowDataCenter] = useState(false);
  const [practiceMode, setPracticeMode] = useState<"lesson" | "mistakes">("lesson");
  const [selectedChapterId, setSelectedChapterId] = useState(CHAPTERS[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(CHAPTERS[0].lessons[0].id);
  const [locationReady, setLocationReady] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [checkpointReady, setCheckpointReady] = useState(false);
  const [reviewWordIds, setReviewWordIds] = useState<string[]>([]);
  const [mistakeChapterFilter, setMistakeChapterFilter] = useState("all");
  const [mistakeLessonFilter, setMistakeLessonFilter] = useState("all");
  const [progress, setProgress] = useState(createEmptyProgress);
  const [activity, setActivity] = useState(createEmptyLearningActivity);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [session, setSession] = useState(() => createLessonSession(CHAPTERS[0].lessons[0].words.map((word) => word.id)));
  const [resultSaved, setResultSaved] = useState(false);
  const [answer, setAnswer] = useState("");
  const [keyboardJamo, setKeyboardJamo] = useState("");
  const [message, setMessage] = useState("");
  const [showPracticeHelp, setShowPracticeHelp] = useState(false);
  const [manualReveal, setManualReveal] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);
  const [nativeKeyboard, setNativeKeyboard] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [resetArmed, setResetArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const chapter = CHAPTERS.find((candidate) => candidate.id === selectedChapterId) ?? CHAPTERS[0];
  const chapterIndex = CHAPTERS.findIndex((candidate) => candidate.id === chapter.id);
  const lessons = chapter.lessons;
  const lesson = lessons.find((candidate) => candidate.id === selectedLessonId) ?? lessons[0];
  const reviewWords = reviewWordIds.flatMap((id) => {
    const entry = COURSE_WORDS.find((candidate) => candidate.word.id === id);
    return entry ? [entry.word] : [];
  });
  const words = practiceMode === "mistakes" ? reviewWords : lesson.words;
  const wordId = session.queue[session.position];
  const word = words.find((candidate) => candidate.id === wordId) ?? words[0] ?? CHAPTERS[0].lessons[0].words[0];
  const completedLessons = Object.values(progress.lessons);
  const dueReviewCount = countDueLessons(progress);
  const recommendation = recommendLesson(CHAPTERS, progress);
  const learningStats = calculateLearningStats(CHAPTERS, progress);
  const activitySummary = summarizeLearningActivity(activity);
  const mistakeEntries = COURSE_WORDS.filter((entry) => {
    if (!progress.mistakes[entry.word.id]) return false;
    if (mistakeChapterFilter !== "all" && entry.chapterId !== mistakeChapterFilter) return false;
    if (mistakeLessonFilter !== "all" && entry.lessonId !== mistakeLessonFilter) return false;
    return true;
  });
  const weakWordIds = selectWeakWordIds(COURSE_WORDS, progress);
  const hasNextGroup = hasNextLessonGroup(session);
  const filterLessons = mistakeChapterFilter === "all"
    ? CHAPTERS.flatMap((item) => item.lessons)
    : CHAPTERS.find((item) => item.id === mistakeChapterFilter)?.lessons ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(readProgress(window.localStorage)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActivity(readLearningActivity(window.localStorage));
      setDailyGoal(readDailyGoal(window.localStorage));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const preferences = readLearningPreferences(window.localStorage);
      setShowEnglish(preferences.showEnglish);
      setNativeKeyboard(preferences.nativeKeyboard);
      setMuted(preferences.muted);
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    writeLearningPreferences(window.localStorage, { showEnglish, nativeKeyboard, muted });
  }, [muted, nativeKeyboard, preferencesReady, showEnglish]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const checkpoint = readLearningCheckpoint(window.localStorage, CHAPTERS);
      if (checkpoint) {
        setPracticeMode(checkpoint.practiceMode);
        setSelectedChapterId(checkpoint.selectedChapterId);
        setSelectedLessonId(checkpoint.selectedLessonId);
        setReviewWordIds(checkpoint.reviewWordIds);
        setSession(checkpoint.session);
        setMessage("已恢复上次练习");
        setStarted(true);
      }
      setCheckpointReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checkpointReady || !started) return;
    if (session.phase === "results" && !hasNextGroup) {
      clearLearningCheckpoint(window.localStorage);
      return;
    }
    writeLearningCheckpoint(window.localStorage, {
      practiceMode,
      selectedChapterId,
      selectedLessonId,
      reviewWordIds,
      session,
    });
  }, [checkpointReady, hasNextGroup, practiceMode, reviewWordIds, selectedChapterId, selectedLessonId, session, started]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const checkpoint = readLearningCheckpoint(window.localStorage, CHAPTERS);
      const location = checkpoint ? null : readLearningLocation(window.localStorage, CHAPTERS);
      if (location) {
        setSelectedChapterId(location.chapterId);
        setSelectedLessonId(location.lessonId);
      }
      setLocationReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!locationReady) return;
    writeLearningLocation(window.localStorage, selectedChapterId, selectedLessonId);
  }, [locationReady, selectedChapterId, selectedLessonId]);

  useEffect(() => {
    if (!started || muted || session.phase === "results") return;
    const timer = window.setTimeout(() => {
      void playKorean(word.id, word.korean).then((played) => {
        if (!played) setSpeechUnavailable(true);
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [started, word.id, word.korean, session.phase, muted]);

  useEffect(() => {
    if (!started || session.phase === "results") return;
    const timer = window.setTimeout(() => {
      if (shouldShowPracticeGuide(window.localStorage)) setShowPracticeHelp(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [session.phase, started]);

  useEffect(() => {
    const timer = window.setTimeout(() => setManualReveal(false), 0);
    return () => window.clearTimeout(timer);
  }, [session.phase, session.position, word.id]);

  useEffect(() => {
    if (!preferencesReady || !started || session.phase === "results") return;
    if (!nativeKeyboard) {
      inputRef.current?.blur();
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timer);
  }, [nativeKeyboard, preferencesReady, session.phase, session.position, started]);

  useEffect(() => {
    if (session.phase !== "results" || resultSaved || hasNextGroup) return;
    const timer = window.setTimeout(() => {
      const summary = summarizeLessonSession(session);
      const accuracy = practiceMode === "mistakes"
        ? Math.round(((words.length - session.mistakeIds.length) / words.length) * 100)
        : Math.round((summary.firstListenCorrect / summary.wordCount) * 100);
      const completedAt = new Date();
      setActivity(recordLearningActivity(window.localStorage, words.length, accuracy, completedAt));
      setProgress((current) => {
        const updated = practiceMode === "mistakes"
          ? recordMistakeReview(current, session.originalWordIds, session.mistakeIds, completedAt.toISOString())
          : recordLessonResult(current, lesson.id, accuracy, summary.mistakeIds, completedAt.toISOString(), true);
        writeProgress(window.localStorage, updated);
        return updated;
      });
      setResultSaved(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasNextGroup, lesson.id, practiceMode, resultSaved, session, words.length]);

  function startLesson(lessonId = selectedLessonId, chapterId = selectedChapterId) {
    const targetChapter = CHAPTERS.find((candidate) => candidate.id === chapterId) ?? CHAPTERS[0];
    const targetLesson = targetChapter.lessons.find((candidate) => candidate.id === lessonId) ?? targetChapter.lessons[0];
    const canResume = practiceMode === "lesson"
      && selectedChapterId === targetChapter.id
      && selectedLessonId === targetLesson.id
      && canResumeLessonSession(session, targetLesson.words.map((item) => item.id));
    setPracticeMode("lesson");
    setSelectedChapterId(targetChapter.id);
    setSelectedLessonId(targetLesson.id);
    if (!canResume) setSession(createLessonSession(targetLesson.words.map((item) => item.id)));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    setResultSaved(false);
    setStarted(true);
    if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function selectChapter(chapterId: string) {
    const targetChapter = CHAPTERS.find((candidate) => candidate.id === chapterId) ?? CHAPTERS[0];
    setSelectedChapterId(targetChapter.id);
    setSelectedLessonId(findChapterContinueLessonId(targetChapter, progress));
  }

  function startMistakeReview(wordIds: string[]) {
    if (!wordIds.length) return;
    setPracticeMode("mistakes");
    setReviewWordIds(wordIds);
    setSession(createReviewSession(wordIds));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    setResultSaved(false);
    setStarted(true);
    if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function startNextGroup() {
    setSession((current) => advanceLessonGroup(current));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function submit() {
    if (isExactSpelling(answer, word.korean)) {
      setShowPracticeHelp(false);
      setMessage("정답이에요! 拼写正确");
      window.setTimeout(() => {
        setSession((current) => submitLessonAnswer(current, word.id, true));
        setAnswer("");
        setKeyboardJamo("");
        setMessage("");
      }, 650);
    } else {
      const isNewLessonMistake = practiceMode === "lesson"
        && session.phase !== "copy"
        && !session.mistakeIds.includes(word.id);
      if (isNewLessonMistake) {
        setProgress((current) => {
          const updated = recordLessonMistake(current, lesson.id, word.id);
          writeProgress(window.localStorage, updated);
          return updated;
        });
      }
      setSession((current) => submitLessonAnswer(current, word.id, false));
      const nextErrorCount = session.currentErrorCount + 1;
      setMessage(session.phase !== "copy" && nextErrorCount >= SPELLING_REVEAL_ERROR_LIMIT
        ? `已显示答案（${SPELLING_REVEAL_ERROR_LIMIT}/${SPELLING_REVEAL_ERROR_LIMIT}），请重新输入正确拼写`
        : session.phase !== "copy"
          ? `这次拼写不正确（${nextErrorCount}/${SPELLING_REVEAL_ERROR_LIMIT}）。红色是错误部分，可再听一次或点“不会写？”`
          : "红色部分不正确，请按删除键后重新输入");
      if (!muted) {
        void playKorean(word.id, word.korean).then((played) => {
          if (!played) setSpeechUnavailable(true);
        });
      }
    }
  }

  function typeKey(key: string) {
    setKeyboardJamo((current) => {
      const next = current + key;
      setAnswer(composeHangul(next));
      return next;
    });
  }

  function deleteKey() {
    if (keyboardJamo) {
      const next = keyboardJamo.slice(0, -1);
      setKeyboardJamo(next);
      setAnswer(composeHangul(next));
    } else {
      setAnswer((current) => current.slice(0, -1));
    }
  }

  function closePracticeHelp() {
    markPracticeGuideSeen(window.localStorage);
    setShowPracticeHelp(false);
  }

  function revealCurrentSpelling() {
    if (manualReveal) {
      closePracticeHelp();
      return;
    }
    setManualReveal(true);
    closePracticeHelp();
    setMessage(session.phase === "copy"
      ? "请照着韩文答案重新拼写；这是韩文拼写，不是罗马音"
      : "已显示韩文答案，本词会按错词记录；请照着答案重新拼写");
    if (session.phase === "copy") return;

    const isNewLessonMistake = practiceMode === "lesson" && !session.mistakeIds.includes(word.id);
    if (isNewLessonMistake) {
      setProgress((current) => {
        const updated = recordLessonMistake(current, lesson.id, word.id);
        writeProgress(window.localStorage, updated);
        return updated;
      });
    }
    setSession((current) => submitLessonAnswer(current, word.id, false));
  }

  function downloadLearningBackup() {
    const content = createLearningBackup(window.localStorage, CHAPTERS);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubekorean-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setBackupMessage("备份已下载，请妥善保存文件。");
    setResetArmed(false);
  }

  async function importLearningBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      restoreLearningBackup(window.localStorage, CHAPTERS, await file.text());
      window.location.reload();
    } catch {
      setBackupMessage("无法恢复：请选择由当前版本 CubeKorean 导出的有效备份。");
      setResetArmed(false);
    }
  }

  function resetLearningData() {
    if (!resetArmed) {
      setResetArmed(true);
      setBackupMessage("此操作会清空本机进度和错词。请再次点击确认。");
      return;
    }
    clearAllLearningData(window.localStorage);
    window.location.reload();
  }

  if (!started && showDataCenter) {
    const completionPercent = Math.round((completedLessons.length / TOTAL_LESSON_COUNT) * 100);
    const masteryTotal = Math.max(learningStats.completedLessons, 1);
    const weeklyMax = Math.max(dailyGoal, ...activitySummary.days.map((day) => day.sessions));
    return (
      <main className="data-page">
        <header className="subpage-header">
          <button className="back-button" onClick={() => { setShowDataCenter(false); setResetArmed(false); setBackupMessage(""); }}>← 返回课程</button>
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
            <div className="section-heading"><div><small>LAST 7 DAYS</small><h2>近七日学习</h2></div><label>每日目标<select value={dailyGoal} onChange={(event) => { const goal = Number(event.target.value); setDailyGoal(goal); writeDailyGoal(window.localStorage, goal); }}>{[1, 2, 3, 4, 5].map((goal) => <option key={goal} value={goal}>{goal} 轮</option>)}</select></label></div>
            <div className="weekly-chart">{activitySummary.days.map((day) => <div key={day.key} className={day.isToday ? "today" : ""}><span><i style={{ height: `${Math.max(day.sessions ? 12 : 3, (day.sessions / weeklyMax) * 100)}%` }} /></span><b>{day.sessions}</b><small>{day.label}</small></div>)}</div>
            <p className="goal-copy">今日已完成 <strong>{activitySummary.today.sessions}</strong> / {dailyGoal} 轮{activitySummary.today.sessions >= dailyGoal ? "，目标达成 ✓" : ""}</p>
          </section>
          <section className="insight-card">
            <div className="section-heading"><div><small>MASTERY</small><h2>掌握度分布</h2></div><strong>{completionPercent}%<span>总课程</span></strong></div>
            <div className="mastery-track" aria-label={`已掌握 ${learningStats.mastery.mastered} 关，熟悉 ${learningStats.mastery.familiar} 关，学习中 ${learningStats.mastery.learning} 关`}><i className="mastered" style={{ width: `${(learningStats.mastery.mastered / masteryTotal) * 100}%` }} /><i className="familiar" style={{ width: `${(learningStats.mastery.familiar / masteryTotal) * 100}%` }} /><i className="learning" style={{ width: `${(learningStats.mastery.learning / masteryTotal) * 100}%` }} /></div>
            <div className="mastery-legend"><span><i className="mastered" />已掌握 {learningStats.mastery.mastered}</span><span><i className="familiar" />熟悉 {learningStats.mastery.familiar}</span><span><i className="learning" />学习中 {learningStats.mastery.learning}</span></div>
          </section>
          <section className="insight-card">
            <div className="section-heading"><div><small>TOPICS</small><h2>主题进度</h2></div><span>{learningStats.completedLessons} / {TOTAL_LESSON_COUNT} 关</span></div>
            <div className="chapter-progress-list">{learningStats.chapters.map((item) => <div className="chapter-progress-item" key={item.chapterId}><div><strong>{item.titleChinese}</strong><span>{item.completedLessons} / {item.totalLessons}</span></div><div className="chapter-progress-track"><i style={{ width: `${item.percent}%` }} /></div></div>)}</div>
          </section>
          <section className="insight-card">
            <div className="section-heading"><div><small>RECENT</small><h2>最近学习</h2></div></div>
            {learningStats.recent.length ? <div className="recent-list">{learningStats.recent.map((item) => <div key={`${item.completedAt}-${item.lessonTitle}`}><span><b>{item.lessonTitle}</b><small>{item.chapterTitle} · {new Date(item.completedAt).toLocaleDateString("zh-CN")}</small></span><strong>{item.accuracy}%</strong></div>)}</div> : <div className="empty-recent">完成第一关后，这里会显示最近学习记录。</div>}
          </section>
          <div className="data-section-title"><small>DATA</small><h2>备份与恢复</h2></div>
          <div className="data-actions">
            <article><span className="data-icon">↓</span><div><h2>下载学习备份</h2><p>保存通关记录、正确率、错词、学习位置和练习偏好。</p></div><button onClick={downloadLearningBackup}>下载备份</button></article>
            <article><span className="data-icon">↑</span><div><h2>恢复学习备份</h2><p>选择 CubeKorean 导出的 JSON 文件，验证成功后替换本机数据。</p></div><button onClick={() => backupInputRef.current?.click()}>选择备份</button><input ref={backupInputRef} className="backup-file-input" type="file" accept="application/json,.json" onChange={importLearningBackup} /></article>
            <article className="danger-zone"><span className="data-icon">×</span><div><h2>重置本机数据</h2><p>清空学习进度、错词、偏好和未完成练习，此操作无法撤销。</p></div><button onClick={resetLearningData}>{resetArmed ? "确认清空" : "重置数据"}</button></article>
          </div>
          <p className={`backup-message ${resetArmed ? "warning" : ""}`} role="status">{backupMessage}</p>
        </section>
      </main>
    );
  }

  if (!started && showMistakeBook) {
    return (
      <main className="mistake-page">
        <header className="subpage-header">
          <button className="back-button" onClick={() => setShowMistakeBook(false)}>← 返回课程</button>
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
            <button disabled={!weakWordIds.length} onClick={() => startMistakeReview(weakWordIds)}>开始复习 <b>→</b></button>
          </section>
          <div className="mistake-filters">
            <label>大关卡<select value={mistakeChapterFilter} onChange={(event) => { setMistakeChapterFilter(event.target.value); setMistakeLessonFilter("all"); }}><option value="all">全部</option>{CHAPTERS.map((item) => <option key={item.id} value={item.id}>{item.titleChinese}</option>)}</select></label>
            <label>小关卡<select value={mistakeLessonFilter} onChange={(event) => setMistakeLessonFilter(event.target.value)}><option value="all">全部</option>{filterLessons.map((item) => <option key={item.id} value={item.id}>{item.titleChinese}</option>)}</select></label>
            <button className="review-button" disabled={!mistakeEntries.length} onClick={() => startMistakeReview(mistakeEntries.map((entry) => entry.word.id))}>复习当前 {mistakeEntries.length} 词 →</button>
          </div>
          {mistakeEntries.length ? <div className="mistake-grid">{mistakeEntries.map((entry) => {
            const mistake = progress.mistakes[entry.word.id];
            return <article key={entry.word.id}><span>{entry.word.emoji}</span><div><b lang="ko">{entry.word.korean}</b><p>{entry.word.chinese} · {entry.word.english}</p><small>{entry.chapterTitle} / {entry.lessonTitle} · 错误 {mistake.errorCount} 次 · 已正确复习 {mistake.correctReviews}/2</small></div></article>;
          })}</div> : <div className="empty-mistakes"><span>✓</span><h2>当前没有错词</h2><p>完成听音拼写后，答错的词会自动出现在这里。</p></div>}
        </section>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="map-page">
        <header className="brand-row">
          <div className="brand" aria-label="CubeKorean 首页"><span>ㅋ</span> CubeKorean</div>
          <div className="header-actions"><button className="mistake-link" onClick={() => setShowMistakeBook(true)}>错词本 <b>{Object.keys(progress.mistakes).length}</b></button><span className="daily-status" aria-label={`今日完成 ${activitySummary.today.sessions} 轮，目标 ${dailyGoal} 轮`}><small>今日</small><strong>{activitySummary.today.sessions}<em>/{dailyGoal}轮</em></strong></span><button className="avatar" onClick={() => setShowDataCenter(true)} aria-label="打开学习数据">안</button></div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">TODAY&apos;S KOREAN</div>
            <h1>听见生活，<br />写出韩语。</h1>
            <p>不从字母表重新开始。直接进入真实生活词汇，用看词拼写和听音默写，把每一个韩语单词真正记下来。</p>
            <div className="today-card">
              <div><span>{dueReviewCount ? `今日待复习 ${dueReviewCount} 关` : recommendation.reason === "complete" ? "全部课程已完成" : "推荐继续学习"}</span><strong>{completedLessons.length} / {TOTAL_LESSON_COUNT} 关</strong></div>
              <div className="mini-progress"><i style={{ width: `${(completedLessons.length / TOTAL_LESSON_COUNT) * 100}%` }} /></div>
              <button onClick={() => startLesson(recommendation.lessonId, recommendation.chapterId)}>{recommendation.reason === "review" ? "开始今日复习" : recommendation.reason === "complete" ? "巩固第一关" : "继续下一关"}<span>→</span></button>
            </div>
          </div>

          <div className="lesson-map">
            <div className="chapter-switcher" aria-label="选择大关卡">
              <button className="chapter-arrow" disabled={chapterIndex <= 0} onClick={() => selectChapter(CHAPTERS[chapterIndex - 1].id)} aria-label="上一个大关卡">←</button>
              <div className="chapter-current"><span>{LESSON_ICONS[chapter.id]?.[0] ?? "✦"}</span><div><small>主题 {chapterIndex + 1} / {CHAPTERS.length}</small><strong>{chapter.titleChinese}</strong><em>{chapter.titleKorean}</em></div></div>
              <select value={chapter.id} onChange={(event) => selectChapter(event.target.value)} aria-label="选择生活主题">{CHAPTERS.map((item, index) => <option value={item.id} key={item.id}>主题 {index + 1} · {item.titleChinese}</option>)}</select>
              <button className="chapter-arrow" disabled={chapterIndex >= CHAPTERS.length - 1} onClick={() => selectChapter(CHAPTERS[chapterIndex + 1].id)} aria-label="下一个大关卡">→</button>
            </div>
            <div className="cube-wrap" aria-hidden="true">
              <div className="cube">
                <div className="face front"><b>{LESSON_ICONS[chapter.id]?.[0] ?? "✦"}</b><span>{chapter.titleKorean.split(" ")[0]}</span></div>
                <div className="face right"><b>{LESSON_ICONS[chapter.id]?.[1] ?? "✦"}</b><span>{chapter.titleChinese}</span></div>
                <div className="face top"><b>✦</b></div>
              </div>
              <div className="cube-shadow" />
            </div>
            <div className="level-meta"><span>{chapter.titleChinese} · 第 {lessons.findIndex((item) => item.id === lesson.id) + 1} 关</span><h2>{lesson.titleChinese}</h2><p>{lesson.titleKorean} · 20词 · 4组练习</p></div>
            <div className="stage-row">
              {lessons.map((item, index) => {
                const unlocked = isLessonUnlocked(lessons.map((entry) => entry.id), item.id, progress);
                const completed = progress.lessons[item.id];
                const selected = item.id === lesson.id;
                return (
                  <button
                    className={`stage ${selected ? "active" : ""} ${completed ? "completed" : ""}`}
                    disabled={!unlocked}
                    key={item.id}
                    onClick={() => setSelectedLessonId(item.id)}
                    aria-label={`${index + 1}. ${item.titleChinese}${unlocked ? "" : "，未解锁"}`}
                  >
                    <span>{completed ? "✓" : unlocked ? LESSON_ICONS[chapter.id][index] : "🔒"}</span>
                    <small>{completed ? (isReviewDue(completed) ? "待复习" : completed.mastery === "mastered" ? "已掌握" : `${completed.bestAccuracy}%`) : unlocked ? item.titleChinese : "未解锁"}</small>
                  </button>
                );
              })}
            </div>
            <button className="primary" onClick={() => startLesson()}>{progress.lessons[lesson.id] ? "再次练习" : "开始本关"} <span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  if (session.phase === "results") {
    const isMistakeReview = practiceMode === "mistakes";
    const lessonSummary = summarizeLessonSession(session);
    const isGroupComplete = !isMistakeReview && hasNextGroup;
    const resultMistakeIds = isGroupComplete ? session.mistakeIds : lessonSummary.mistakeIds;
    const resultWordCount = isGroupComplete ? session.originalWordIds.length : lessonSummary.wordCount;
    const accuracy = isMistakeReview
      ? Math.round(((words.length - session.mistakeIds.length) / words.length) * 100)
      : isGroupComplete
        ? Math.round((session.firstListenCorrect / session.originalWordIds.length) * 100)
        : Math.round((lessonSummary.firstListenCorrect / lessonSummary.wordCount) * 100);
    const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
    const nextLesson = lessons[lessonIndex + 1];
    return (
      <main className="results-page">
        <section className="results-card">
          <div className="result-mark">✓</div>
          <div className="eyebrow">{isMistakeReview ? "REVIEW COMPLETE" : isGroupComplete ? `GROUP ${session.groupIndex + 1} COMPLETE` : "LESSON COMPLETE"}</div>
          <h1>{isMistakeReview ? "复习完成！" : isGroupComplete ? `第 ${session.groupIndex + 1} 组完成！` : "本关完成！"}</h1>
          <p>{isMistakeReview ? `本轮复习 ${words.length} 个错词` : isGroupComplete ? `已完成 5 个词，稍作停顿再继续` : `${lesson.titleKorean} · ${lesson.titleChinese}`}</p>
          <div className="result-stats">
            <div><strong>{resultWordCount}</strong><span>{isGroupComplete ? "本组词汇" : "学习词汇"}</span></div>
            <div><strong>{accuracy}%</strong><span>{isMistakeReview ? "本轮一次答对率" : "首次听写正确率"}</span></div>
            <div><strong>{resultMistakeIds.length}</strong><span>{isMistakeReview ? "仍需复习" : "重练词汇"}</span></div>
          </div>
          {resultMistakeIds.length > 0 && (
            <div className="mistake-list">
              <span>{isMistakeReview ? "本轮出现错误" : isGroupComplete ? "本组已纠正" : "本关已纠正"}</span>
              <div>{resultMistakeIds.map((id) => <b key={id}>{words.find((item) => item.id === id)?.korean}</b>)}</div>
            </div>
          )}
          <button className="primary" onClick={() => isGroupComplete ? startNextGroup() : isMistakeReview ? setStarted(false) : nextLesson ? startLesson(nextLesson.id) : startLesson()}>{isGroupComplete ? `继续第 ${session.groupIndex + 2} 组` : isMistakeReview ? "返回错词本" : nextLesson ? "进入下一关" : "再练一次"} <span>{isMistakeReview || nextLesson || isGroupComplete ? "→" : "↻"}</span></button>
          <button className="result-link" onClick={() => { setStarted(false); if (isMistakeReview) setShowMistakeBook(false); }}>{isMistakeReview ? "返回课程地图" : "返回关卡地图"}</button>
        </section>
      </main>
    );
  }

  const isCopyPhase = session.phase === "copy";
  const revealSpelling = manualReveal || shouldRevealSpelling(session);
  const displayLength = Math.max(word.korean.length, answer.length);
  const lessonProgressPercent = ((session.position + 1) / session.queue.length) * 100;
  const phaseLabel = session.phase === "copy" ? "看词拼写" : session.phase === "listen" ? "听音拼写" : "错词重练";
  const phaseNumber = session.phase === "copy" ? "01" : session.phase === "listen" ? "02" : "03";
  const groupTotal = session.groupSize ? Math.ceil(session.allWordIds.length / session.groupSize) : 1;

  return (
    <main
      className="practice-page"
      onClickCapture={() => {
        if (nativeKeyboard) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      <header className="practice-header">
        <button className="icon-button" onClick={() => setStarted(false)} aria-label="退出练习">×</button>
        <div className="progress-track" role="progressbar" aria-label="本轮学习进度" aria-valuemin={0} aria-valuemax={session.queue.length} aria-valuenow={session.position + 1}><span style={{ width: `${lessonProgressPercent}%` }} /></div>
        <div className="counter">{session.groupSize && <span>第 {session.groupIndex + 1}/{groupTotal} 组 · </span>}<b>{session.position + 1}</b> / {session.queue.length}</div>
      </header>

      <div className="mode-pill"><span>{phaseNumber}</span>{phaseLabel}</div>

      <section className="word-stage">
        <button
          type="button"
          className="practice-help-trigger"
          aria-expanded={showPracticeHelp}
          aria-controls="practice-help"
          onClick={() => {
            setShowPracticeHelp((current) => !current);
          }}
        ><b>?</b> 不会写</button>
        {showPracticeHelp && <aside id="practice-help" className="practice-help" role="dialog" aria-labelledby="practice-help-title">
          <button type="button" className="practice-help-close" onClick={closePracticeHelp} aria-label="关闭练习说明">×</button>
          <small>{isCopyPhase ? "看词拼写说明" : "听音拼写说明"}</small>
          <h2 id="practice-help-title">怎么练？</h2>
          <p>{isCopyPhase
            ? "上方灰色韩文就是目标答案。请用下面的页面键盘，从头拼写这个韩语单词，不需要输入罗马音。"
            : "先听韩语发音，再用下面的页面键盘拼写。完全不记得时可以直接查看韩文答案，不必故意答错。"}</p>
          <div className="practice-help-legend"><span><i className="legend-correct" />黑色：正确</span><span><i className="legend-wrong" />红色：需修改</span><span><i className="legend-pending" />灰色：未输入</span></div>
          <div className="practice-help-actions">
            {!isCopyPhase && <button type="button" onClick={() => {
              void playKorean(word.id, word.korean).then((played) => {
                if (!played) setSpeechUnavailable(true);
              });
            }}>再听一次</button>}
            <button type="button" className="reveal-action" onClick={revealCurrentSpelling}>显示韩文答案</button>
            <button type="button" onClick={closePracticeHelp}>我知道了</button>
          </div>
        </aside>}
        <div className="emoji-card">{word.emoji}</div>
        <button
          className="sound-button"
          disabled={speechUnavailable}
          onClick={(event) => {
            event.stopPropagation();
            void playKorean(word.id, word.korean).then((played) => {
              if (!played) setSpeechUnavailable(true);
            });
          }}
          aria-label={speechUnavailable ? "韩语发音不可用" : "播放韩语发音"}
        >▶<span>{speechUnavailable ? "发音不可用" : "听发音"}</span></button>
        {speechUnavailable && <p className="speech-notice" role="status">当前浏览器无法朗读韩语，仍可继续看词拼写和听写练习。</p>}

        <div className="word-display" lang="ko" aria-label={`当前输入 ${answer}`}>
          {Array.from({ length: displayLength }).map((_, i) => {
            const typed = answer[i];
            const expected = word.korean[i];
            // Compare prefixes after decomposing syllable blocks so an IME's
            // unfinished ㅋ is correctly accepted as the beginning of 커.
            const className = typed
              ? (followsTargetPrefix(answer.slice(0, i + 1), word.korean) ? "correct" : "wrong")
              : "pending";
            return <span className={className} key={i}>{typed || (isCopyPhase ? expected : "＿")}</span>;
          })}
          {!answer && !isCopyPhase && <span className="caret" />}
        </div>

        <input
          ref={inputRef}
          className="hidden-input"
          value={answer}
          lang="ko"
          inputMode={nativeKeyboard ? "text" : "none"}
          readOnly={!nativeKeyboard}
          autoCapitalize="none"
          autoComplete="off"
          onChange={(event) => {
            setKeyboardJamo("");
            setAnswer(event.target.value.replace(/\s/g, ""));
          }}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          aria-label="输入韩语拼写"
        />

        <div className="translation"><strong>{word.chinese}</strong>{showEnglish && <span>{word.english}</span>}</div>
        {revealSpelling && <div className="answer-reveal" role="status"><span>{manualReveal ? "韩文答案" : `提示答案 · ${SPELLING_REVEAL_ERROR_LIMIT}/${SPELLING_REVEAL_ERROR_LIMIT}`}</span><strong lang="ko">{word.korean}</strong><small>重新拼写正确后继续</small></div>}
        <p aria-live="polite" className={`feedback ${answer && !isExactSpelling(answer, word.korean) ? "error" : ""}`}>{message || (isCopyPhase ? "照着灰色韩文，用下方键盘重新拼写（不是写读音）" : session.phase === "retry" ? "重新写对这个听写错词；不会时可点右侧提示" : "根据发音拼写韩文；不会时可点右侧提示")}</p>
      </section>

      <section className="keyboard-area">
        <div className="utility-row">
          <button onClick={() => setMuted(!muted)}>{muted ? "🔇" : "🔊"} 自动发音</button>
          <button onClick={() => setShowEnglish(!showEnglish)}>EN {showEnglish ? "开启" : "关闭"}</button>
          <button onClick={() => { setAnswer(""); setKeyboardJamo(""); setMessage(""); }}>↻ 重来</button>
        </div>

        {!nativeKeyboard && <div className="keyboard">
          {KEYS.map((row, rowIndex) => <div className="key-row" key={rowIndex}>
            {row.map((key) => <button key={key} onClick={() => typeKey(key)}>{key}</button>)}
            {rowIndex === 2 && <button className="delete" onClick={deleteKey} aria-label="删除一个韩文字母">⌫</button>}
          </div>)}
        </div>}
        <div className="bottom-actions">
          <button className="native" onClick={() => {
            const useNativeKeyboard = !nativeKeyboard;
            setNativeKeyboard(useNativeKeyboard);
            if (useNativeKeyboard) {
              setKeyboardJamo("");
              window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
            } else {
              inputRef.current?.blur();
            }
          }}>{nativeKeyboard ? "显示页面键盘" : "使用系统韩语键盘"}</button>
          <button className="check" disabled={!answer} onClick={submit}>检查答案 <span>↵</span></button>
        </div>
      </section>
    </main>
  );
}
