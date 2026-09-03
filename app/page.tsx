"use client";

import { useEffect, useRef, useState } from "react";

type Word = { ko: string; zh: string; en: string; emoji: string };

const WORDS: Word[] = [
  { ko: "커피", zh: "咖啡", en: "coffee", emoji: "☕" },
  { ko: "맥주", zh: "啤酒", en: "beer", emoji: "🍺" },
  { ko: "우유", zh: "牛奶", en: "milk", emoji: "🥛" },
  { ko: "물", zh: "水", en: "water", emoji: "💧" },
  { ko: "주스", zh: "果汁", en: "juice", emoji: "🧃" },
];

const KEYS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];

const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// Turn completed Hangul syllables back into the same compatibility jamo that
// appears while a Korean IME is still composing (ㅋ → 커 → 커ㅍ → 커피).
function decomposeHangul(value: string) {
  return Array.from(value).flatMap((character) => {
    const code = character.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return [character];
    const offset = code - 0xac00;
    const initial = Math.floor(offset / 588);
    const vowel = Math.floor((offset % 588) / 28);
    const final = offset % 28;
    return [INITIALS[initial], VOWELS[vowel], ...(final ? [FINALS[final]] : [])];
  }).join("");
}

function followsTargetPrefix(value: string, target: string) {
  return decomposeHangul(target).startsWith(decomposeHangul(value));
}

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
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState<"copy" | "listen">("copy");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [showEnglish, setShowEnglish] = useState(true);
  const [nativeKeyboard, setNativeKeyboard] = useState(false);
  const [muted, setMuted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const word = WORDS[index];

  useEffect(() => {
    if (!started || muted) return;
    const timer = window.setTimeout(() => speak(word.ko), 280);
    return () => window.clearTimeout(timer);
  }, [started, word.ko, round, muted]);

  function nextWord() {
    setAnswer("");
    setMessage("");
    if (index < WORDS.length - 1) {
      setIndex(index + 1);
    } else if (round === "copy") {
      setIndex(0);
      setRound("listen");
      setMessage("现在隐藏韩文，进入听音拼写");
    } else {
      setIndex(0);
      setRound("copy");
      setStarted(false);
    }
  }

  function submit() {
    if (answer === word.ko) {
      setMessage("정답이에요! 拼写正确");
      window.setTimeout(nextWord, 650);
    } else {
      setMessage("再听一次，修改红色的位置");
      if (!muted) speak(word.ko);
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
          <a className="brand" href="#" aria-label="Moa 首页"><span>ㅁ</span> moa</a>
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
            <button className="primary" onClick={() => { setStarted(true); setTimeout(() => inputRef.current?.focus(), 100); }}>开始本关 <span>→</span></button>
          </div>
        </section>
      </main>
    );
  }

  const displayLength = Math.max(word.ko.length, answer.length);
  const progress = ((round === "copy" ? index : WORDS.length + index) / (WORDS.length * 2)) * 100;

  return (
    <main className="practice-page">
      <header className="practice-header">
        <button className="icon-button" onClick={() => setStarted(false)} aria-label="退出练习">×</button>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <div className="counter"><b>{round === "copy" ? index + 1 : WORDS.length + index + 1}</b> / {WORDS.length * 2}</div>
      </header>

      <div className="mode-pill"><span>{round === "copy" ? "01" : "02"}</span>{round === "copy" ? "看词拼写" : "听音拼写"}</div>

      <section className="word-stage" onClick={() => inputRef.current?.focus()}>
        <div className="emoji-card">{word.emoji}</div>
        <button className="sound-button" onClick={(event) => { event.stopPropagation(); speak(word.ko); }} aria-label="播放韩语发音">▶<span>听发音</span></button>

        <div className="word-display" aria-label={`当前输入 ${answer}`}>
          {Array.from({ length: displayLength }).map((_, i) => {
            const typed = answer[i];
            // Compare prefixes after decomposing syllable blocks so an IME's
            // unfinished ㅋ is correctly accepted as the beginning of 커.
            const className = typed
              ? (followsTargetPrefix(answer.slice(0, i + 1), word.ko) ? "correct" : "wrong")
              : "pending";
            return <span className={className} key={i}>{typed || (round === "copy" ? target : "＿")}</span>;
          })}
          {!answer && round === "listen" && <span className="caret" />}
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

        <div className="translation"><strong>{word.zh}</strong>{showEnglish && <span>{word.en}</span>}</div>
        <p className={`feedback ${answer && answer !== word.ko ? "error" : ""}`}>{message || (round === "copy" ? "照着上面的韩文输入一遍" : "根据读音写出这个单词")}</p>
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
