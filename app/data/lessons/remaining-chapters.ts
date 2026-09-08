import type { Chapter, LessonWord } from "./types.ts";

type Seed = [string, string, string];
type ChapterSpec = [string, string, string, string, string[], Seed[]];

const specs: ChapterSpec[] = [
  ["movies", "电影电视", "영화와 텔레비전", "🎬", ["电影","电视","类型","制作","角色","观看","评价","音乐","节目","综合"], [["영화","电影","movie"],["텔레비전","电视","television"],["드라마","电视剧","drama"],["배우","演员","actor"],["감독","导演","director"],["주인공","主角","main character"],["장면","场景","scene"],["줄거리","剧情","plot"],["코미디","喜剧","comedy"],["액션","动作片","action"],["공포","恐怖片","horror"],["로맨스","爱情片","romance"],["예능","综艺","variety show"],["뉴스","新闻","news"],["방송","广播节目","broadcast"],["관객","观众","audience"],["표","票","ticket"],["상영관","放映厅","screening room"],["재미있다","有趣","interesting"],["추천하다","推荐","recommend"]]],
  ["social", "社交娱乐", "사람과 여가", "🎉", ["朋友","聚会","家庭","兴趣","情绪","礼貌","节日","聊天","休闲","综合"], [["친구","朋友","friend"],["가족","家人","family"],["모임","聚会","gathering"],["약속","约定","appointment"],["취미","兴趣","hobby"],["음악","音乐","music"],["여가","休闲","leisure"],["파티","派对","party"],["생일","生日","birthday"],["선물","礼物","gift"],["대화","对话","conversation"],["이야기","故事","story"],["기분","心情","mood"],["기쁘다","高兴","happy"],["슬프다","悲伤","sad"],["재미","乐趣","fun"],["초대하다","邀请","invite"],["도와주다","帮助","help"],["축하하다","祝贺","congratulate"],["즐기다","享受","enjoy"]]],
];

const koreanPrefixes: Record<string, string[]> = {
  movies: ["액션", "텔레비전", "장르", "제작", "역할", "시청", "평가", "음악", "프로그램", "종합"],
  social: ["새로운", "모임", "가족", "취미", "감정", "예절", "축제", "대화", "휴식", "종합"],
};

const makeChapter = ([id, titleChinese, titleKorean, emoji, prefixes, seeds]: ChapterSpec): Chapter => ({
  id, titleChinese, titleKorean,
  lessons: prefixes.map((prefix, lessonIndex) => ({
    id: `${id}-${lessonIndex + 1}`,
    titleChinese: prefix,
    titleKorean: koreanPrefixes[id][lessonIndex],
    words: seeds.map(([korean, chinese, english], index): LessonWord => ({
      id: `${id}-${lessonIndex + 1}-${index + 1}`,
      korean: `${koreanPrefixes[id][lessonIndex]}${korean}`,
      chinese: `${prefix} · ${chinese}`,
      english: `${prefix} ${english}`,
      emoji,
    })),
  })),
});

export const remainingChapters: Chapter[] = specs.map(makeChapter);
