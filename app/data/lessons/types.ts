export type LessonWord = {
  id: string;
  korean: string;
  chinese: string;
  english: string;
  emoji: string;
};

export type Lesson = {
  id: string;
  titleChinese: string;
  titleKorean: string;
  words: LessonWord[];
};

export type Chapter = {
  id: string;
  titleChinese: string;
  titleKorean: string;
  lessons: Lesson[];
};
