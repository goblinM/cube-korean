import type { Chapter, LessonWord } from "./types.ts";

type Seed = [string, string, string];
type ChapterSpec = [string, string, string, string, string[], Seed[]];

const specs: ChapterSpec[] = [
  ["tourism", "旅游景点", "여행과 관광", "🗺️", ["城市","自然","文化","传统","公园","拍照","路线","活动","纪念","综合"], [["여행","旅行","travel"],["관광","观光","sightseeing"],["명소","景点","attraction"],["지도","地图","map"],["예약","预约","reservation"],["입장권","门票","admission ticket"],["박물관","博物馆","museum"],["미술관","美术馆","art gallery"],["궁궐","宫殿","palace"],["공원","公园","park"],["전망대","观景台","observatory"],["폭포","瀑布","waterfall"],["해변","海边","beach"],["산책","散步","walk"],["사진","照片","photo"],["기념품","纪念品","souvenir"],["안내소","咨询处","information desk"],["입구","入口","entrance"],["출구","出口","exit"],["구경하다","参观","look around"]]],
  ["shopping", "购物生活", "쇼핑과 생활", "🛍️", ["商场","衣物","鞋包","支付","网购","食品","家居","日用品","退换","综合"], [["쇼핑","购物","shopping"],["매장","店铺","store"],["상품","商品","product"],["가격","价格","price"],["할인","折扣","discount"],["사이즈","尺码","size"],["색상","颜色","color"],["옷","衣服","clothes"],["신발","鞋","shoes"],["가방","包","bag"],["계산대","收银台","checkout counter"],["영수증","收据","receipt"],["카드","卡","card"],["현금","现金","cash"],["배송","配送","delivery"],["주문","订单","order"],["교환","换货","exchange"],["환불","退款","refund"],["품질","质量","quality"],["필요하다","需要","need"]]],
  ["fitness", "运动健身", "운동과 건강", "🏃", ["跑步","球类","健身房","器材","动作","比赛","户外","饮食","损伤","综合"], [["운동","运动","exercise"],["체육관","体育馆","gymnasium"],["헬스장","健身房","fitness center"],["달리기","跑步","running"],["걷기","走路","walking"],["축구","足球","soccer"],["농구","篮球","basketball"],["야구","棒球","baseball"],["수영","游泳","swimming"],["자전거","自行车","bicycle"],["공","球","ball"],["운동화","运动鞋","sneakers"],["라켓","球拍","racket"],["경기","比赛","match"],["선수","运动员","athlete"],["팀","队伍","team"],["훈련","训练","training"],["스트레칭","拉伸","stretching"],["부상","受伤","injury"],["건강하다","健康","be healthy"]]],
  ["movies", "电影电视", "영화와 텔레비전", "🎬", ["电影","电视","类型","制作","角色","观看","评价","音乐","节目","综合"], [["영화","电影","movie"],["텔레비전","电视","television"],["드라마","电视剧","drama"],["배우","演员","actor"],["감독","导演","director"],["주인공","主角","main character"],["장면","场景","scene"],["줄거리","剧情","plot"],["코미디","喜剧","comedy"],["액션","动作片","action"],["공포","恐怖片","horror"],["로맨스","爱情片","romance"],["예능","综艺","variety show"],["뉴스","新闻","news"],["방송","广播节目","broadcast"],["관객","观众","audience"],["표","票","ticket"],["상영관","放映厅","screening room"],["재미있다","有趣","interesting"],["추천하다","推荐","recommend"]]],
  ["social", "社交娱乐", "사람과 여가", "🎉", ["朋友","聚会","家庭","兴趣","情绪","礼貌","节日","聊天","休闲","综合"], [["친구","朋友","friend"],["가족","家人","family"],["모임","聚会","gathering"],["약속","约定","appointment"],["취미","兴趣","hobby"],["음악","音乐","music"],["여가","休闲","leisure"],["파티","派对","party"],["생일","生日","birthday"],["선물","礼物","gift"],["대화","对话","conversation"],["이야기","故事","story"],["기분","心情","mood"],["기쁘다","高兴","happy"],["슬프다","悲伤","sad"],["재미","乐趣","fun"],["초대하다","邀请","invite"],["도와주다","帮助","help"],["축하하다","祝贺","congratulate"],["즐기다","享受","enjoy"]]],
];

const koreanPrefixes: Record<string, string[]> = {
  tourism: ["도시", "자연", "문화", "전통", "공원", "사진", "경로", "활동", "기념", "종합"],
  shopping: ["백화점", "의류", "신발", "결제", "온라인", "식품", "가구", "생활용품", "교환", "종합"],
  fitness: ["달리기", "구기", "헬스", "기구", "동작", "경기", "야외", "식단", "부상", "종합"],
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
