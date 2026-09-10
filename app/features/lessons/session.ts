export type LessonPhase = "copy" | "listen" | "retry" | "results";

export const LESSON_GROUP_SIZE = 5;

export type LessonSession = {
  phase: LessonPhase;
  queue: string[];
  position: number;
  originalWordIds: string[];
  mistakeIds: string[];
  firstListenCorrect: number;
  currentHadError: boolean;
  currentErrorCount: number;
  allWordIds: string[];
  groupIndex: number;
  groupSize: number | null;
  completedFirstListenCorrect: number;
  completedMistakeIds: string[];
};

/** 创建从看词阶段开始的学习会话，并保留原始词序供听写阶段重新使用。 */
export function createLessonSession(wordIds: string[]): LessonSession {
  const groupWordIds = wordIds.slice(0, LESSON_GROUP_SIZE);
  return {
    phase: "copy",
    queue: groupWordIds,
    position: 0,
    originalWordIds: groupWordIds,
    mistakeIds: [],
    firstListenCorrect: 0,
    currentHadError: false,
    currentErrorCount: 0,
    allWordIds: [...wordIds],
    groupIndex: 0,
    groupSize: LESSON_GROUP_SIZE,
    completedFirstListenCorrect: 0,
    completedMistakeIds: [],
  };
}

/** 创建只包含听写与纠错的错词复习会话，不重复看词抄写阶段。 */
export function createReviewSession(wordIds: string[]): LessonSession {
  return {
    phase: "retry",
    queue: [...wordIds],
    position: 0,
    originalWordIds: [...wordIds],
    mistakeIds: [],
    firstListenCorrect: 0,
    currentHadError: false,
    currentErrorCount: 0,
    allWordIds: [...wordIds],
    groupIndex: 0,
    groupSize: null,
    completedFirstListenCorrect: 0,
    completedMistakeIds: [],
  };
}

/** 判断当前小组完成后是否还有下一组词，专项错词复习不启用分组。 */
export function hasNextLessonGroup(session: LessonSession): boolean {
  return session.phase === "results"
    && session.groupSize !== null
    && (session.groupIndex + 1) * session.groupSize < session.allWordIds.length;
}

/** 汇总已完成小组和当前小组的整关正确数、错词及总词数。 */
export function summarizeLessonSession(session: LessonSession) {
  return {
    wordCount: session.allWordIds.length,
    firstListenCorrect: session.completedFirstListenCorrect + session.firstListenCorrect,
    mistakeIds: [...new Set([...session.completedMistakeIds, ...session.mistakeIds])],
  };
}

/** 从组间结果页进入下一组，并保留之前小组的整关统计。 */
export function advanceLessonGroup(session: LessonSession): LessonSession {
  if (!hasNextLessonGroup(session) || session.groupSize === null) return session;
  const groupIndex = session.groupIndex + 1;
  const groupWordIds = session.allWordIds.slice(groupIndex * session.groupSize, (groupIndex + 1) * session.groupSize);
  return {
    ...session,
    phase: "copy",
    queue: groupWordIds,
    position: 0,
    originalWordIds: groupWordIds,
    mistakeIds: [],
    firstListenCorrect: 0,
    currentHadError: false,
    currentErrorCount: 0,
    groupIndex,
    completedFirstListenCorrect: session.completedFirstListenCorrect + session.firstListenCorrect,
    completedMistakeIds: [...new Set([...session.completedMistakeIds, ...session.mistakeIds])],
  };
}

/** 仅在听写或错词重练中连续答错三次后显示当前单词，避免看词阶段重复提示。 */
export function shouldRevealSpelling(session: LessonSession): boolean {
  return (session.phase === "listen" || session.phase === "retry") && session.currentErrorCount >= 3;
}

/** 记录当前答案；错误时停留并登记错词，正确时推进下一题或切换听写、重练和结果阶段。 */
export function submitLessonAnswer(
  session: LessonSession,
  wordId: string,
  isCorrect: boolean,
): LessonSession {
  if (session.phase === "results" || session.queue[session.position] !== wordId) return session;

  if (!isCorrect) {
    const shouldTrack = session.phase !== "copy" && !session.mistakeIds.includes(wordId);
    return {
      ...session,
      currentHadError: true,
      currentErrorCount: session.currentErrorCount + 1,
      mistakeIds: shouldTrack ? [...session.mistakeIds, wordId] : session.mistakeIds,
    };
  }

  const firstListenCorrect = session.phase === "listen" && !session.currentHadError
    ? session.firstListenCorrect + 1
    : session.firstListenCorrect;
  if (session.position < session.queue.length - 1) {
    return { ...session, position: session.position + 1, firstListenCorrect, currentHadError: false, currentErrorCount: 0 };
  }

  if (session.phase === "copy") {
    return { ...session, phase: "listen", queue: [...session.originalWordIds], position: 0, firstListenCorrect, currentHadError: false, currentErrorCount: 0 };
  }
  if (session.phase === "listen" && session.mistakeIds.length > 0) {
    return { ...session, phase: "retry", queue: [...session.mistakeIds], position: 0, firstListenCorrect, currentHadError: false, currentErrorCount: 0 };
  }
  return { ...session, phase: "results", position: 0, firstListenCorrect, currentHadError: false, currentErrorCount: 0 };
}
