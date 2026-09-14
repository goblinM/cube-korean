export type LessonPhase = "copy" | "listen" | "retry" | "results";

export const LESSON_GROUP_SIZE = 5;
export const SPELLING_REVEAL_ERROR_LIMIT = 2;

export type LessonSession = {
  phase: LessonPhase;
  startPhase?: "copy" | "listen";
  groupOnly?: boolean;
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

/** 创建整关或指定五词组会话；直接听写只跳过看词阶段。 */
export function createLessonSession(
  wordIds: string[],
  options: { startPhase?: "copy" | "listen"; replayGroupIndex?: number } = {},
): LessonSession {
  const groupIndex = options.replayGroupIndex ?? 0;
  if (!Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex * LESSON_GROUP_SIZE >= wordIds.length) {
    throw new RangeError("无效的词汇分组");
  }
  const groupWordIds = wordIds.slice(groupIndex * LESSON_GROUP_SIZE, (groupIndex + 1) * LESSON_GROUP_SIZE);
  return {
    phase: options.startPhase ?? "copy",
    startPhase: options.startPhase ?? "copy",
    groupOnly: options.replayGroupIndex !== undefined,
    queue: groupWordIds,
    position: 0,
    originalWordIds: groupWordIds,
    mistakeIds: [],
    firstListenCorrect: 0,
    currentHadError: false,
    currentErrorCount: 0,
    allWordIds: [...wordIds],
    groupIndex,
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
    && !session.groupOnly
    && session.groupSize !== null
    && (session.groupIndex + 1) * session.groupSize < session.allWordIds.length;
}

/** 判断当前未完成会话是否属于同一小关卡，可安全从原分组位置继续。 */
export function canResumeLessonSession(session: LessonSession, wordIds: string[]): boolean {
  return (session.phase !== "results" || hasNextLessonGroup(session))
    && session.allWordIds.length === wordIds.length
    && session.allWordIds.every((id, index) => id === wordIds[index]);
}

/** 汇总已完成小组和当前小组的整关正确数、错词及总词数。 */
export function summarizeLessonSession(session: LessonSession) {
  return {
    wordCount: session.groupOnly ? session.originalWordIds.length : session.allWordIds.length,
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
    phase: session.startPhase ?? "copy",
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

/** 仅重开当前五词组并切换起始阶段，保留此前各组的成绩与错词。 */
export function restartCurrentLessonGroup(session: LessonSession, startPhase: "copy" | "listen"): LessonSession {
  if (session.groupSize === null || session.phase === "results") return session;
  return {
    ...session,
    phase: startPhase,
    startPhase,
    queue: [...session.originalWordIds],
    position: 0,
    mistakeIds: [],
    firstListenCorrect: 0,
    currentHadError: false,
    currentErrorCount: 0,
  };
}

/** 仅在听写或错词重练中连续答错两次后显示当前单词，避免看词阶段重复提示。 */
export function shouldRevealSpelling(session: LessonSession): boolean {
  return (session.phase === "listen" || session.phase === "retry")
    && session.currentErrorCount >= SPELLING_REVEAL_ERROR_LIMIT;
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
