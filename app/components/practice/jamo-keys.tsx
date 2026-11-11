export const KEYS = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];
export const PHYSICAL_KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
export const SHIFTED_PHYSICAL_KEYS: Record<string, string> = { Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ", O: "ㅒ", P: "ㅖ" };

type Props = {
  disabled?: boolean;
  next?: string;
  latin?: boolean;
  onKey: (key: string) => void;
  onDelete: () => void;
  deleteLabel: string;
};

export function JamoKeys({ disabled, next, latin, onKey, onDelete, deleteLabel }: Props) {
  return <div className="keyboard">{KEYS.map((row, i) => (
    <div className="key-row" key={i}>{row.map((key, j) => (
      <button type="button" disabled={disabled} key={key} data-next={key === next || undefined}
        aria-label={key} onClick={() => onKey(key)}>
        {latin && <small aria-hidden="true">{PHYSICAL_KEY_ROWS[i][j]}</small>}{key}
      </button>
    ))}
    {i === 2 && <button type="button" disabled={disabled} className="delete" onClick={onDelete} aria-label={deleteLabel}>⌫</button>}
    </div>
  ))}</div>;
}
