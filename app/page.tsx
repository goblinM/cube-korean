"use client";

import { useEffect, useRef, useState } from "react";
import { CHAPTERS, COURSE_WORDS } from "./data/lessons/course";
import { createLessonSession, createReviewSession, submitLessonAnswer } from "./features/lessons/session";
import {
  createEmptyProgress,
  isReviewDue,
  isLessonUnlocked,
  readProgress,
  recordMistakeReview,
  recordLessonResult,
  writeProgress,
} from "./features/progress/local-progress";
import { speakKorean } from "./features/speech/korean-speech";
import { composeHangul } from "./features/spelling/compose-hangul";
import { followsTargetPrefix, isExactSpelling } from "./features/spelling/hangul";

const LESSON_ICONS: Record<string, string[]> = {
  "daily-food": ["☕", "🍳", "🍚", "🍎", "🥬", "🍰", "🍽️", "🌶️", "🍲", "🥩"],
  "daily-travel": ["🚌", "🧭", "🚦", "🚄", "✈️", "🏨", "📸", "🎒", "🎫", "🚑"],
  "hotel-stay": ["🏨", "📅", "🛎️", "🛏️", "🛋️", "🚿", "🧹", "⚠️", "💳", "🧳"],
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
  const [practiceMode, setPracticeMode] = useState<"lesson" | "mistakes">("lesson");
  const [selectedChapterId, setSelectedChapterId] = useState(CHAPTERS[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(CHAPTERS[0].lessons[0].id);
  const [reviewWordIds, setReviewWordIds] = useState<string[]>([]);
  const [mistakeChapterFilter, setMistakeChapterFilter] = useState("all");
  const [mistakeLessonFilter, setMistakeLessonFilter] = useState("all");
  const [progress, setProgress] = useState(createEmptyProgress);
  const [session, setSession] = useState(() => createLessonSession(CHAPTERS[0].lessons[0].words.map((word) => word.id)));
  const [resultSaved, setResultSaved] = useState(false);
  const [answer, setAnswer] = useState("");
  const [keyboardJamo, setKeyboardJamo] = useState("");
  const [message, setMessage] = useState("");
  const [showEnglish, setShowEnglish] = useState(true);
  const [nativeKeyboard, setNativeKeyboard] = useState(true);
  const [muted, setMuted] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chapter = CHAPTERS.find((candidate) => candidate.id === selectedChapterId) ?? CHAPTERS[0];
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
  const dueReviewCount = completedLessons.filter((item) => isReviewDue(item)).length;
  const mistakeEntries = COURSE_WORDS.filter((entry) => {
    if (!progress.mistakes[entry.word.id]) return false;
    if (mistakeChapterFilter !== "all" && entry.chapterId !== mistakeChapterFilter) return false;
    if (mistakeLessonFilter !== "all" && entry.lessonId !== mistakeLessonFilter) return false;
    return true;
  });
  const filterLessons = mistakeChapterFilter === "all"
    ? CHAPTERS.flatMap((item) => item.lessons)
    : CHAPTERS.find((item) => item.id === mistakeChapterFilter)?.lessons ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(readProgress(window.localStorage)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started || muted || session.phase === "results") return;
    const timer = window.setTimeout(() => {
      if (!speakKorean(word.korean)) setSpeechUnavailable(true);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [started, word.korean, session.phase, muted]);

  useEffect(() => {
    if (session.phase !== "results" || resultSaved) return;
    const timer = window.setTimeout(() => {
      const accuracy = Math.round((session.firstListenCorrect / words.length) * 100);
      setProgress((current) => {
        const updated = practiceMode === "mistakes"
          ? recordMistakeReview(current, session.originalWordIds, session.mistakeIds)
          : recordLessonResult(current, lesson.id, accuracy, session.mistakeIds);
        writeProgress(window.localStorage, updated);
        return updated;
      });
      setResultSaved(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lesson.id, practiceMode, resultSaved, session, words.length]);

  function startLesson(lessonId = selectedLessonId) {
    const targetLesson = lessons.find((candidate) => candidate.id === lessonId) ?? lessons[0];
    setPracticeMode("lesson");
    setSelectedLessonId(targetLesson.id);
    setSession(createLessonSession(targetLesson.words.map((item) => item.id)));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    setResultSaved(false);
    setStarted(true);
    window.setTimeout(() => inputRef.current?.focus(), 100);
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
    window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function submit() {
    if (isExactSpelling(answer, word.korean)) {
      setMessage("정답이에요! 拼写正确");
      window.setTimeout(() => {
        setSession((current) => submitLessonAnswer(current, word.id, true));
        setAnswer("");
        setKeyboardJamo("");
        setMessage("");
      }, 650);
    } else {
      setSession((current) => submitLessonAnswer(current, word.id, false));
      setMessage("再听一次，修改红色的位置");
      if (!muted && !speakKorean(word.korean)) setSpeechUnavailable(true);
    }
  }

  function typeKey(key: string) {
    setKeyboardJamo((current) => {
      const next = current + key;
      setAnswer(composeHangul(next));
      return next;
    });
    inputRef.current?.focus();
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
          <div className="header-actions"><button className="mistake-link" onClick={() => setShowMistakeBook(true)}>错词本 <b>{Object.keys(progress.mistakes).length}</b></button><span className="streak">🔥 7</span><button className="avatar" aria-label="个人中心">안</button></div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">TODAY&apos;S KOREAN</div>
            <h1>听见生活，<br />写出韩语。</h1>
            <p>不从字母表重新开始。直接进入真实生活词汇，用看词拼写和听音默写，把每一个韩语单词真正记下来。</p>
            <div className="today-card">
              <div><span>{dueReviewCount ? `今日待复习 ${dueReviewCount} 关` : "课程进度"}</span><strong>{completedLessons.length} / {TOTAL_LESSON_COUNT} 关</strong></div>
              <div className="mini-progress"><i style={{ width: `${(completedLessons.length / TOTAL_LESSON_COUNT) * 100}%` }} /></div>
            </div>
          </div>

          <div className="lesson-map">
            <div className="chapter-tabs" aria-label="选择大关卡">{CHAPTERS.map((item, index) => <button className={item.id === chapter.id ? "active" : ""} key={item.id} onClick={() => { setSelectedChapterId(item.id); setSelectedLessonId(item.lessons[0].id); }}><span>{index === 0 ? "🍽️" : index === 1 ? "🚌" : "🏨"}</span>{item.titleChinese}<small>{item.titleKorean}</small></button>)}</div>
            <div className="cube-wrap" aria-hidden="true">
              <div className="cube">
                <div className="face front"><b>{chapter.id === "daily-food" ? "☕" : chapter.id === "daily-travel" ? "🚌" : "🏨"}</b><span>{chapter.id === "daily-food" ? "카페" : chapter.id === "daily-travel" ? "교통" : "호텔"}</span></div>
                <div className="face right"><b>{chapter.id === "daily-food" ? "🍜" : chapter.id === "daily-travel" ? "✈️" : "🛎️"}</b><span>{chapter.id === "daily-food" ? "음식" : chapter.id === "daily-travel" ? "여행" : "숙박"}</span></div>
                <div className="face top"><b>✦</b></div>
              </div>
              <div className="cube-shadow" />
            </div>
            <div className="level-meta"><span>{chapter.titleChinese} · 第 {lessons.findIndex((item) => item.id === lesson.id) + 1} 关</span><h2>{lesson.titleChinese}</h2><p>{lesson.titleKorean} · 20词</p></div>
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
    const accuracy = isMistakeReview
      ? Math.round(((words.length - session.mistakeIds.length) / words.length) * 100)
      : Math.round((session.firstListenCorrect / words.length) * 100);
    const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
    const nextLesson = lessons[lessonIndex + 1];
    return (
      <main className="results-page">
        <section className="results-card">
          <div className="result-mark">✓</div>
          <div className="eyebrow">{isMistakeReview ? "REVIEW COMPLETE" : "LESSON COMPLETE"}</div>
          <h1>{isMistakeReview ? "复习完成！" : "本关完成！"}</h1>
          <p>{isMistakeReview ? `本轮复习 ${words.length} 个错词` : `${lesson.titleKorean} · ${lesson.titleChinese}`}</p>
          <div className="result-stats">
            <div><strong>{words.length}</strong><span>学习词汇</span></div>
            <div><strong>{accuracy}%</strong><span>{isMistakeReview ? "本轮一次答对率" : "首次听写正确率"}</span></div>
            <div><strong>{session.mistakeIds.length}</strong><span>{isMistakeReview ? "仍需复习" : "重练词汇"}</span></div>
          </div>
          {session.mistakeIds.length > 0 && (
            <div className="mistake-list">
              <span>{isMistakeReview ? "本轮出现错误" : "本关已纠正"}</span>
              <div>{session.mistakeIds.map((id) => <b key={id}>{words.find((item) => item.id === id)?.korean}</b>)}</div>
            </div>
          )}
          <button className="primary" onClick={() => isMistakeReview ? setStarted(false) : nextLesson ? startLesson(nextLesson.id) : startLesson()}>{isMistakeReview ? "返回错词本" : nextLesson ? "进入下一关" : "再练一次"} <span>{isMistakeReview || nextLesson ? "→" : "↻"}</span></button>
          <button className="result-link" onClick={() => { setStarted(false); if (isMistakeReview) setShowMistakeBook(false); }}>{isMistakeReview ? "返回课程地图" : "返回关卡地图"}</button>
        </section>
      </main>
    );
  }

  const isCopyPhase = session.phase === "copy";
  const displayLength = Math.max(word.korean.length, answer.length);
  const lessonProgressPercent = ((session.position + 1) / session.queue.length) * 100;
  const phaseLabel = session.phase === "copy" ? "看词拼写" : session.phase === "listen" ? "听音拼写" : "错词重练";
  const phaseNumber = session.phase === "copy" ? "01" : session.phase === "listen" ? "02" : "03";

  return (
    <main className="practice-page">
      <header className="practice-header">
        <button className="icon-button" onClick={() => setStarted(false)} aria-label="退出练习">×</button>
        <div className="progress-track" role="progressbar" aria-label="本轮学习进度" aria-valuemin={0} aria-valuemax={session.queue.length} aria-valuenow={session.position + 1}><span style={{ width: `${lessonProgressPercent}%` }} /></div>
        <div className="counter"><b>{session.position + 1}</b> / {session.queue.length}</div>
      </header>

      <div className="mode-pill"><span>{phaseNumber}</span>{phaseLabel}</div>

      <section className="word-stage">
        <div className="emoji-card">{word.emoji}</div>
        <button
          className="sound-button"
          disabled={speechUnavailable}
          onClick={(event) => {
            event.stopPropagation();
            if (!speakKorean(word.korean)) setSpeechUnavailable(true);
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
        <p aria-live="polite" className={`feedback ${answer && !isExactSpelling(answer, word.korean) ? "error" : ""}`}>{message || (isCopyPhase ? "照着上面的韩文输入一遍" : session.phase === "retry" ? "重新写对这个听写错词" : "根据读音写出这个单词")}</p>
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
            if (nativeKeyboard) setKeyboardJamo("");
            setNativeKeyboard(!nativeKeyboard);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}>{nativeKeyboard ? "显示页面键盘" : "使用系统韩语键盘"}</button>
          <button className="check" disabled={!answer} onClick={submit}>检查答案 <span>↵</span></button>
        </div>
      </section>
    </main>
  );
}
