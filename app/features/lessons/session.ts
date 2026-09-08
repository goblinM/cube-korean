export type LessonPhase = "copy" | "listen" | "retry" | "results";

export type LessonSession = {
  phase: LessonPhase;
  queue: string[];
  position: number;
  originalWordIds: string[];
  mistakeIds: string[];
  firstListenCorrect: number;
  currentHadError: boolean;
};

/** 创建从看词阶段开始的学习会话，并保留原始词序供听写阶段重新使用。 */
export function createLessonSession(wordIds: string[]): LessonSession {
  return {
    phase: "copy",
    queue: [...wordIds],
    position: 0,
    originalWordIds: [...wordIds],
    mistakeIds: [],
    firstListenCorrect: 0,
    currentHadError: false,
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
  };
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
      mistakeIds: shouldTrack ? [...session.mistakeIds, wordId] : session.mistakeIds,
    };
  }

  const firstListenCorrect = session.phase === "listen" && !session.currentHadError
    ? session.firstListenCorrect + 1
    : session.firstListenCorrect;
  if (session.position < session.queue.length - 1) {
    return { ...session, position: session.position + 1, firstListenCorrect, currentHadError: false };
  }

  if (session.phase === "copy") {
    return { ...session, phase: "listen", queue: [...session.originalWordIds], position: 0, firstListenCorrect, currentHadError: false };
  }
  if (session.phase === "listen" && session.mistakeIds.length > 0) {
    return { ...session, phase: "retry", queue: [...session.mistakeIds], position: 0, firstListenCorrect, currentHadError: false };
  }
  return { ...session, phase: "results", position: 0, firstListenCorrect, currentHadError: false };
}
