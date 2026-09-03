import type { Chapter } from "./types";

/** 提供日常饮食大关卡的已审核课程数据；当前仅包含原型词汇，其余内容在语言审核后补入。 */
export const dailyFoodChapter: Chapter = {
  id: "daily-food",
  titleChinese: "日常饮食",
  titleKorean: "일상 음식",
  lessons: [
    {
      id: "cafe-drinks",
      titleChinese: "咖啡店与饮品",
      titleKorean: "카페와 음료",
      words: [
        { id: "coffee", korean: "커피", chinese: "咖啡", english: "coffee", emoji: "☕" },
        { id: "beer", korean: "맥주", chinese: "啤酒", english: "beer", emoji: "🍺" },
        { id: "milk", korean: "우유", chinese: "牛奶", english: "milk", emoji: "🥛" },
        { id: "water", korean: "물", chinese: "水", english: "water", emoji: "💧" },
        { id: "juice", korean: "주스", chinese: "果汁", english: "juice", emoji: "🧃" },
      ],
    },
  ],
};
