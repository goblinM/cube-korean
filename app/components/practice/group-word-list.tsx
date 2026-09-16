import type { LessonWord } from "../../data/lessons/types";
import { playKorean } from "../../features/speech/korean-speech";

type GroupWordListProps = {
  open: boolean;
  groupIndex: number;
  groupTotal: number;
  words: LessonWord[];
  currentWordId: string;
  onOpen: () => void;
  onClose: () => void;
  onSpeechUnavailable: () => void;
};

/** 展示当前五词组并提供独立试听，不改变练习会话进度。 */
export function GroupWordList({ open, groupIndex, groupTotal, words, currentWordId, onOpen, onClose, onSpeechUnavailable }: GroupWordListProps) {
  return (
    <>
      <button type="button" className="group-list-trigger" aria-label={`查看第 ${groupIndex + 1} 组词单`} aria-expanded={open} aria-controls="group-word-list" onClick={onOpen}>
        <span className="group-list-icon" aria-hidden="true"><i /><i /><i /></span><small>{words.length}</small>
      </button>
      {open && <>
        <button type="button" className="group-list-backdrop" onClick={onClose} aria-label="关闭本组词单" />
        <aside id="group-word-list" className="group-word-list" role="dialog" aria-modal="true" aria-labelledby="group-word-list-title">
          <header><div><div className="group-list-meta"><span>第 {groupIndex + 1} / {groupTotal} 组</span><em>{words.length} 个词</em></div><h2 id="group-word-list-title">本组词汇</h2><p>查看释义，或单独播放韩语发音</p></div><button type="button" onClick={onClose} aria-label="关闭本组词单">×</button></header>
          <div className="group-word-items">{words.map((word, index) => <article className={word.id === currentWordId ? "current" : ""} key={word.id}>
            <span>{String(index + 1).padStart(2, "0")}</span><div><b lang="ko">{word.korean}</b><small>{word.chinese}</small></div>
            <div className="group-word-action">{word.id === currentWordId && <em>当前</em>}<button type="button" onClick={() => void playKorean(word.id, word.korean).then((played) => { if (!played) onSpeechUnavailable(); })} aria-label={`播放 ${word.korean} 的韩语发音`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 10v4h3l4 3V7l-4 3H5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M15 9.2a4 4 0 0 1 0 5.6M17.5 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></button></div>
          </article>)}</div>
          <footer><span>提示</span>可反复试听，熟悉后再关闭词单继续拼写</footer>
        </aside>
      </>}
    </>
  );
}
