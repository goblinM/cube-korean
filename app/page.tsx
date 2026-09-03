"use client";

import { useEffect, useRef, useState } from "react";
import { dailyFoodChapter } from "./data/lessons/daily-food";
import { createLessonSession, submitLessonAnswer } from "./features/lessons/session";
import { followsTargetPrefix, isExactSpelling } from "./features/spelling/hangul";

const WORDS = dailyFoodChapter.lessons[0].words;

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
  const [session, setSession] = useState(() => createLessonSession(WORDS.map((word) => word.id)));
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [showEnglish, setShowEnglish] = useState(true);
  const [nativeKeyboard, setNativeKeyboard] = useState(false);
  const [muted, setMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordId = session.queue[session.position];
  const word = WORDS.find((candidate) => candidate.id === wordId) ?? WORDS[0];

  useEffect(() => {
    if (!started || muted || session.phase === "results") return;
    const timer = window.setTimeout(() => speak(word.korean), 280);
    return () => window.clearTimeout(timer);
  }, [started, word.korean, session.phase, muted]);

  function startLesson() {
    setSession(createLessonSession(WORDS.map((item) => item.id)));
    setAnswer("");
    setMessage("");
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
              <div><span>今日目标</span><strong>5 个生活词汇</strong></div>
              <div className="mini-progress"><i /></div>
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
            <div className="level-meta"><span>生活词汇 · 第一站</span><h2>咖啡店与饮品</h2><p>카페와 음료</p></div>
            <div className="stage-row">
              {[1,2,3,4,5].map((n) => <div key={n} className={`stage ${n === 1 ? "active" : ""}`}><span>{n === 1 ? "▶" : n}</span><small>{n === 1 ? "开始" : "未解锁"}</small></div>)}
            </div>
            <button className="primary" onClick={startLesson}>开始本关 <span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  if (session.phase === "results") {
    const accuracy = Math.round((session.firstListenCorrect / WORDS.length) * 100);
    return (
      <main className="results-page">
        <section className="results-card">
          <div className="result-mark">✓</div>
          <div className="eyebrow">LESSON COMPLETE</div>
          <h1>本关完成！</h1>
          <p>커피숍과 음료 · 咖啡店与饮品</p>
          <div className="result-stats">
            <div><strong>{WORDS.length}</strong><span>学习词汇</span></div>
            <div><strong>{accuracy}%</strong><span>首次听写正确率</span></div>
            <div><strong>{session.mistakeIds.length}</strong><span>重练词汇</span></div>
          </div>
          {session.mistakeIds.length > 0 && (
            <div className="mistake-list">
              <span>本关已纠正</span>
              <div>{session.mistakeIds.map((id) => <b key={id}>{WORDS.find((item) => item.id === id)?.korean}</b>)}</div>
            </div>
          )}
          <button className="primary" onClick={startLesson}>再练一次 <span>↻</span></button>
          <button className="result-link" onClick={() => setStarted(false)}>返回关卡地图</button>
        </section>
      </main>
    );
  }

  const isCopyPhase = session.phase === "copy";
  const displayLength = Math.max(word.korean.length, answer.length);
  const progress = ((session.position + 1) / session.queue.length) * 100;
  const phaseLabel = session.phase === "copy" ? "看词拼写" : session.phase === "listen" ? "听音拼写" : "错词重练";
  const phaseNumber = session.phase === "copy" ? "01" : session.phase === "listen" ? "02" : "03";

  return (
    <main className="practice-page">
      <header className="practice-header">
        <button className="icon-button" onClick={() => setStarted(false)} aria-label="退出练习">×</button>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
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
