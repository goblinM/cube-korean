import { useState } from "react";
import { useI18n } from "../../i18n/i18n-context";
import { MAX_ROUND_SIZE, validRoundSize } from "../../features/typing/round";

const presets = [10, 30, 50];
export function TypingSetup({ size, onStart, onSize }: { size: number; onStart: (size: number) => void; onSize: (size: number) => void }) {
  const { t } = useI18n();
  const [custom, setCustom] = useState(!presets.includes(size));
  const [draft, setDraft] = useState(String(size));
  const target = custom ? Number(draft) : size;
  return <form className="typing-setup" onSubmit={event => {
    event.preventDefault();
    if (validRoundSize(target)) onStart(target);
  }}>
    <div className="cube-wrap typing-cube" aria-hidden="true">
      <div className="cube">
        <div className="face front"><b>ㅋ</b><span>한글</span></div>
        <div className="face right"><b>ㅏ</b><span>ㄱ ㄴ ㄷ</span></div>
        <div className="face top"><b>⌨</b></div>
      </div>
      <div className="cube-shadow" />
    </div>
    <h2>{t("typing.lead")}</h2>
    <fieldset><legend>{t("typing.goal")}</legend>
      <div className="typing-options">{presets.map(n =>
        <button type="button" key={n} aria-pressed={!custom && size === n} onClick={() => { setCustom(false); onSize(n); }}>{n}</button>
      )}
      <button type="button" aria-pressed={custom} onClick={() => { setDraft(String(size)); setCustom(true); }}>{t("typing.custom")}</button></div>
      <label className="custom-count" style={{ visibility: custom ? "visible" : "hidden" }} aria-hidden={!custom} inert={!custom}>{t("typing.range")}
        <input type="number" inputMode="numeric" min={1} max={MAX_ROUND_SIZE} disabled={!custom} required={custom} value={draft}
          onChange={event => {
            const value = event.target.value;
            setDraft(value);
            if (validRoundSize(Number(value))) onSize(Number(value));
          }} />
      </label>
    </fieldset>
    <button className="primary" disabled={!validRoundSize(target)}>{t("typing.start")} <span aria-hidden="true">→</span></button>
  </form>;
}
