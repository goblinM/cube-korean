const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

/** 将完整韩文音节拆为兼容字母序列，使最终音节可以与输入法的实时组合状态进行比较。 */
export function decomposeHangul(value: string): string {
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

/** 判断当前韩语输入是否仍是目标词的有效组合前缀，避免IME尚未完成音节时提前标红。 */
export function followsTargetPrefix(value: string, target: string): boolean {
  return decomposeHangul(target).startsWith(decomposeHangul(value));
}

/** 判断用户是否已输入完整且完全相同的目标词，用于提交答案和结束当前题目。 */
export function isExactSpelling(value: string, target: string): boolean {
  return value === target;
}
