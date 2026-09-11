const INITIALS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const FINALS = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const DOUBLE_INITIALS: Record<string, string> = { "ㄱㄱ": "ㄲ", "ㄷㄷ": "ㄸ", "ㅂㅂ": "ㅃ", "ㅅㅅ": "ㅆ", "ㅈㅈ": "ㅉ" };
const COMPOUND_VOWELS: Record<string, string> = {
  "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ", "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ", "ㅡㅣ": "ㅢ",
};
const COMPOUND_FINALS: Record<string, string> = {
  "ㄱㄱ": "ㄲ", "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ", "ㅂㅅ": "ㅄ", "ㅅㅅ": "ㅆ",
};
const SPLIT_FINALS = Object.fromEntries(Object.entries(COMPOUND_FINALS).map(([pair, combined]) => [combined, Array.from(pair)]));

function makeSyllable(initial: string, vowel: string, final = ""): string {
  return String.fromCharCode(0xac00 + INITIALS.indexOf(initial) * 588 + VOWELS.indexOf(vowel) * 28 + FINALS.indexOf(final));
}

function targetUsesDoubleInitial(target: string, output: string, doubleInitial: string): boolean {
  if (!target) return false;
  const targetCharacters = Array.from(target);
  const syllableIndex = Array.from(output).length;
  const currentCode = targetCharacters[syllableIndex]?.charCodeAt(0) ?? 0;
  const nextCode = targetCharacters[syllableIndex + 1]?.charCodeAt(0) ?? 0;
  if (currentCode < 0xac00 || currentCode > 0xd7a3 || nextCode < 0xac00 || nextCode > 0xd7a3) return false;

  const currentHasNoFinal = (currentCode - 0xac00) % 28 === 0;
  const nextInitial = INITIALS[Math.floor((nextCode - 0xac00) / 588)];
  return currentHasNoFinal && nextInitial === doubleInitial;
}

/** 将页面键盘产生的兼容韩文字母序列组合为现代韩文音节，并保留尚未成音节的输入。 */
export function composeHangul(jamo: string, target = ""): string {
  let output = "";
  let initial = "";
  let vowel = "";
  let final = "";
  const characters = Array.from(jamo);

  const flush = () => {
    if (initial && vowel) output += makeSyllable(initial, vowel, final);
    else output += initial || vowel;
    initial = "";
    vowel = "";
    final = "";
  };

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    const isVowel = VOWELS.includes(character);
    const isConsonant = INITIALS.includes(character) || FINALS.includes(character);

    if (!isVowel && !isConsonant) {
      flush();
      output += character;
      continue;
    }

    if (isVowel) {
      if (!initial) {
        const combined = vowel && COMPOUND_VOWELS[vowel + character];
        if (combined) vowel = combined;
        else { flush(); vowel = character; }
      } else if (!vowel) {
        vowel = character;
      } else if (!final) {
        const combined = COMPOUND_VOWELS[vowel + character];
        if (combined) vowel = combined;
        else { flush(); vowel = character; }
      } else {
        const split = SPLIT_FINALS[final];
        const nextInitial = split ? split[1] : final;
        final = split ? split[0] : "";
        flush();
        initial = nextInitial;
        vowel = character;
      }
      continue;
    }

    if (!initial && !vowel) {
      initial = character;
    } else if (!initial && vowel) {
      flush();
      initial = character;
    } else if (initial && !vowel) {
      const combined = DOUBLE_INITIALS[initial + character];
      if (combined) initial = combined;
      else { flush(); initial = character; }
    } else if (!final && FINALS.includes(character)) {
      final = character;
    } else if (final) {
      const doubleInitial = DOUBLE_INITIALS[final + character];
      const nextIsVowel = VOWELS.includes(characters[index + 1]);
      if (doubleInitial && nextIsVowel && targetUsesDoubleInitial(target, output, doubleInitial)) {
        final = "";
        flush();
        initial = doubleInitial;
      } else {
        const combined = COMPOUND_FINALS[final + character];
        if (combined) final = combined;
        else { flush(); initial = character; }
      }
    } else {
      flush();
      initial = character;
    }
  }

  flush();
  return output;
}
