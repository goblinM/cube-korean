"use client";

import { useEffect, useRef, useState } from "react";
import { dailyFoodChapter } from "./data/lessons/daily-food";
import { createLessonSession, submitLessonAnswer } from "./features/lessons/session";
import {
  createEmptyProgress,
  isLessonUnlocked,
  readProgress,
  recordLessonResult,
  writeProgress,
} from "./features/progress/local-progress";
import { followsTargetPrefix, isExactSpelling } from "./features/spelling/hangul";

const LESSONS = dailyFoodChapter.lessons;
const LESSON_IDS = ["☕", "🍳", "🍚", "🍎", "🥬", "🍰", "🍽️", "🌶️", "🍲", "🥩"];

const KEYS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(LESSONS[0].id);
  const [progress, setProgress] = useState(createEmptyProgress);
  const [session, setSession] = useState(() => createLessonSession(LESSONS[0].words.map((word) => word.id)));
  const [resultSaved, setResultSaved] = useState(false);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [showEnglish, setShowEnglish] = useState(true);
  const [nativeKeyboard, setNativeKeyboard] = useState(true);
  const [muted, setMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lesson = LESSONS.find((candidate) => candidate.id === selectedLessonId) ?? LESSONS[0];
  const words = lesson.words;
  const wordId = session.queue[session.position];
  const word = words.find((candidate) => candidate.id === wordId) ?? words[0];

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(readProgress(window.localStorage)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started || muted || session.phase === "results") return;
    const timer = window.setTimeout(() => speak(word.korean), 280);
    return () => window.clearTimeout(timer);
  }, [started, word.korean, session.phase, muted]);

  useEffect(() => {
    if (session.phase !== "results" || resultSaved) return;
    const timer = window.setTimeout(() => {
      const accuracy = Math.round((session.firstListenCorrect / words.length) * 100);
      setProgress((current) => {
        const updated = recordLessonResult(current, lesson.id, accuracy, session.mistakeIds);
        writeProgress(window.localStorage, updated);
        return updated;
      });
      setResultSaved(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [lesson.id, resultSaved, session, words.length]);

  function startLesson(lessonId = selectedLessonId) {
    const targetLesson = LESSONS.find((candidate) => candidate.id === lessonId) ?? LESSONS[0];
    setSelectedLessonId(targetLesson.id);
    setSession(createLessonSession(targetLesson.words.map((item) => item.id)));
    setAnswer("");
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
        setMessage("");
      }, 650);
    } else {
      setSession((current) => submitLessonAnswer(current, word.id, false));
      setMessage("再听一次，修改红色的位置");
      if (!muted) speak(word.korean);
    }
  }

  function typeKey(key: string) {
    setAnswer((current) => current + key);
    inputRef.current?.focus();
  }

  if (!started) {
    return (
      <main className="map-page">
        <header className="brand-row">
          <div className="brand" aria-label="CubeKorean 首页"><span>ㅋ</span> CubeKorean</div>
          <div className="header-actions"><span className="streak">🔥 7</span><button className="avatar" aria-label="个人中心">안</button></div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">TODAY&apos;S KOREAN</div>
            <h1>听见生活，<br />写出韩语。</h1>
            <p>不从字母表重新开始。直接进入真实生活词汇，用看词拼写和听音默写，把每一个韩语单词真正记下来。</p>
            <div className="today-card">
              <div><span>课程进度</span><strong>{Object.keys(progress.lessons).length} / {LESSONS.length} 关</strong></div>
              <div className="mini-progress"><i style={{ width: `${(Object.keys(progress.lessons).length / LESSONS.length) * 100}%` }} /></div>
            </div>
          </div>

          <div className="lesson-map">
            <div className="cube-wrap" aria-hidden="true">
              <div className="cube">
                <div className="face front"><b>☕</b><span>카페</span></div>
                <div className="face right"><b>🍜</b><span>음식</span></div>
                <div className="face top"><b>✦</b></div>
              </div>
              <div className="cube-shadow" />
            </div>
            <div className="level-meta"><span>{dailyFoodChapter.titleChinese} · 第 {LESSONS.findIndex((item) => item.id === lesson.id) + 1} 关</span><h2>{lesson.titleChinese}</h2><p>{lesson.titleKorean} · 20词</p></div>
            <div className="stage-row">
              {LESSONS.map((item, index) => {
                const unlocked = isLessonUnlocked(LESSONS.map((entry) => entry.id), item.id, progress);
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
                    <span>{completed ? "✓" : unlocked ? LESSON_IDS[index] : "🔒"}</span>
                    <small>{completed ? `${completed.bestAccuracy}%` : unlocked ? item.titleChinese : "未解锁"}</small>
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
    const accuracy = Math.round((session.firstListenCorrect / words.length) * 100);
    const lessonIndex = LESSONS.findIndex((item) => item.id === lesson.id);
    const nextLesson = LESSONS[lessonIndex + 1];
    return (
      <main className="results-page">
        <section className="results-card">
          <div className="result-mark">✓</div>
          <div className="eyebrow">LESSON COMPLETE</div>
          <h1>本关完成！</h1>
          <p>{lesson.titleKorean} · {lesson.titleChinese}</p>
          <div className="result-stats">
            <div><strong>{words.length}</strong><span>学习词汇</span></div>
            <div><strong>{accuracy}%</strong><span>首次听写正确率</span></div>
            <div><strong>{session.mistakeIds.length}</strong><span>重练词汇</span></div>
          </div>
          {session.mistakeIds.length > 0 && (
            <div className="mistake-list">
              <span>本关已纠正</span>
              <div>{session.mistakeIds.map((id) => <b key={id}>{words.find((item) => item.id === id)?.korean}</b>)}</div>
            </div>
          )}
          <button className="primary" onClick={() => nextLesson ? startLesson(nextLesson.id) : startLesson()}>{nextLesson ? "进入下一关" : "再练一次"} <span>{nextLesson ? "→" : "↻"}</span></button>
          <button className="result-link" onClick={() => setStarted(false)}>返回关卡地图</button>
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
        <div className="progress-track"><span style={{ width: `${lessonProgressPercent}%` }} /></div>
        <div className="counter"><b>{session.position + 1}</b> / {session.queue.length}</div>
      </header>

      <div className="mode-pill"><span>{phaseNumber}</span>{phaseLabel}</div>

      <section className="word-stage">
        <div className="emoji-card">{word.emoji}</div>
        <button className="sound-button" onClick={(event) => { event.stopPropagation(); speak(word.korean); }} aria-label="播放韩语发音">▶<span>听发音</span></button>

        <div className="word-display" aria-label={`当前输入 ${answer}`}>
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
          onChange={(event) => setAnswer(event.target.value.replace(/\s/g, ""))}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          aria-label="输入韩语拼写"
        />

        <div className="translation"><strong>{word.chinese}</strong>{showEnglish && <span>{word.english}</span>}</div>
        <p className={`feedback ${answer && !isExactSpelling(answer, word.korean) ? "error" : ""}`}>{message || (isCopyPhase ? "照着上面的韩文输入一遍" : session.phase === "retry" ? "重新写对这个听写错词" : "根据读音写出这个单词")}</p>
      </section>

      <section className="keyboard-area">
        <div className="utility-row">
          <button onClick={() => setMuted(!muted)}>{muted ? "🔇" : "🔊"} 自动发音</button>
          <button onClick={() => setShowEnglish(!showEnglish)}>EN {showEnglish ? "开启" : "关闭"}</button>
          <button onClick={() => { setAnswer(""); setMessage(""); }}>↻ 重来</button>
        </div>

        {!nativeKeyboard && <div className="keyboard">
          {KEYS.map((row, rowIndex) => <div className="key-row" key={rowIndex}>
            {row.map((key) => <button key={key} onClick={() => typeKey(key)}>{key}</button>)}
            {rowIndex === 2 && <button className="delete" onClick={() => setAnswer(answer.slice(0, -1))}>⌫</button>}
          </div>)}
        </div>}
        <div className="bottom-actions">
          <button className="native" onClick={() => { setNativeKeyboard(!nativeKeyboard); setTimeout(() => inputRef.current?.focus(), 50); }}>{nativeKeyboard ? "显示页面键盘" : "使用系统韩语键盘"}</button>
          <button className="check" disabled={!answer} onClick={submit}>检查答案 <span>↵</span></button>
        </div>
      </section>
    </main>
  );
}
