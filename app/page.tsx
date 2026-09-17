"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { CourseMapPage } from "./components/course-map-page";
import { LearningDataPage } from "./components/learning-data-page";
import { LessonResultsPage } from "./components/lesson-results-page";
import { MistakeBookPage } from "./components/mistake-book-page";
import { GroupWordList } from "./components/practice/group-word-list";
import { HangulKeyboard } from "./components/practice/hangul-keyboard";
import { PracticeHeader } from "./components/practice/practice-header";
import { PracticeOptionsDialog } from "./components/practice/practice-options-dialog";
import { PracticeWordStage } from "./components/practice/practice-word-stage";
import { CHAPTERS, COURSE_WORDS } from "./data/lessons/course";
import {
  advanceLessonGroup,
  canResumeLessonSession,
  createLessonSession,
  createReviewSession,
  hasNextLessonGroup,
  restartCurrentLessonGroup,
  SPELLING_REVEAL_ERROR_LIMIT,
  submitLessonAnswer,
  summarizeLessonSession,
} from "./features/lessons/session";
import { findChapterContinueLessonId } from "./features/lessons/recommendation";
import { markPracticeGuideSeen, shouldShowPracticeGuide } from "./features/lessons/practice-guide";
import {
  createEmptyProgress,
  readProgress,
  recordLessonMistake,
  recordMistakeReview,
  recordLessonResult,
  writeProgress,
} from "./features/progress/local-progress";
import { readLearningLocation, writeLearningLocation } from "./features/progress/learning-location";
import { clearLearningCheckpoint, readLearningCheckpoint, writeLearningCheckpoint } from "./features/progress/learning-checkpoint";
import { readLearningPreferences, writeLearningPreferences, type TranslationMode } from "./features/progress/learning-preferences";
import { resilientBrowserStorage } from "./features/progress/resilient-storage";
import { clearAllLearningData, createLearningBackup, restoreLearningBackup } from "./features/progress/learning-backup";
import { calculateLearningStats } from "./features/progress/learning-stats";
import { dismissFutureCoffeeTips, getCoffeeTipMilestone, markCoffeeTipShown, readCoffeeTipState } from "./features/progress/coffee-tip";
import {
  createEmptyLearningActivity,
  readDailyGoal,
  readLearningActivity,
  recordLearningActivity,
  recordStudiedWord,
  summarizeLearningActivity,
  writeDailyGoal,
} from "./features/progress/learning-activity";
import { playKorean } from "./features/speech/korean-speech";
import { playKeyboardSound } from "./features/speech/keyboard-sound";
import { composeHangul } from "./features/spelling/compose-hangul";
import { isExactSpelling } from "./features/spelling/hangul";

const TOTAL_LESSON_COUNT = CHAPTERS.reduce((total, item) => total + item.lessons.length, 0);
const CORRECT_ADVANCE_DELAY_MS = 350;

export default function Home() {
  const [started, setStarted] = useState(false);
  const [showMistakeBook, setShowMistakeBook] = useState(false);
  const [showDataCenter, setShowDataCenter] = useState(false);
  const [practiceMode, setPracticeMode] = useState<"lesson" | "mistakes">("lesson");
  const [selectedChapterId, setSelectedChapterId] = useState(CHAPTERS[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(CHAPTERS[0].lessons[0].id);
  const [selectedStartPhase, setSelectedStartPhase] = useState<"copy" | "listen">("copy");
  const [selectedReplayGroupIndex, setSelectedReplayGroupIndex] = useState<number | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [checkpointReady, setCheckpointReady] = useState(false);
  const [reviewWordIds, setReviewWordIds] = useState<string[]>([]);
  const [mistakeChapterFilter, setMistakeChapterFilter] = useState("all");
  const [mistakeLessonFilter, setMistakeLessonFilter] = useState("all");
  const [progress, setProgress] = useState(createEmptyProgress);
  const [activity, setActivity] = useState(createEmptyLearningActivity);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [session, setSession] = useState(() => createLessonSession(CHAPTERS[0].lessons[0].words.map((word) => word.id)));
  const [resultSaved, setResultSaved] = useState(false);
  const [coffeeTipMilestone, setCoffeeTipMilestone] = useState<number | null>(null);
  const [showCoffeeSupport, setShowCoffeeSupport] = useState(false);
  const [answer, setAnswer] = useState("");
  const [keyboardJamo, setKeyboardJamo] = useState("");
  const [message, setMessage] = useState("");
  const [showPracticeHelp, setShowPracticeHelp] = useState(false);
  const [showGroupWords, setShowGroupWords] = useState(false);
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const [manualReveal, setManualReveal] = useState(false);
  const [translationMode, setTranslationMode] = useState<TranslationMode>("ko-zh-en");
  const [nativeKeyboard, setNativeKeyboard] = useState(true);
  const [muted, setMuted] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [keySound, setKeySound] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [resetArmed, setResetArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const practiceOptionsTriggerRef = useRef<HTMLButtonElement>(null);
  const practiceOptionsCloseRef = useRef<HTMLButtonElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const chapter = CHAPTERS.find((candidate) => candidate.id === selectedChapterId) ?? CHAPTERS[0];
  const lessons = chapter.lessons;
  const lesson = lessons.find((candidate) => candidate.id === selectedLessonId) ?? lessons[0];
  const reviewWords = reviewWordIds.flatMap((id) => {
    const entry = COURSE_WORDS.find((candidate) => candidate.word.id === id);
    return entry ? [entry.word] : [];
  });
  const words = practiceMode === "mistakes" ? reviewWords : lesson.words;
  const wordId = session.queue[session.position];
  const word = words.find((candidate) => candidate.id === wordId) ?? words[0] ?? CHAPTERS[0].lessons[0].words[0];
  const learningStats = calculateLearningStats(CHAPTERS, progress);
  const activitySummary = summarizeLearningActivity(activity);
  const hasNextGroup = hasNextLessonGroup(session);
  const requestedReplayGroupIndex = progress.lessons[lesson.id] ? selectedReplayGroupIndex : null;
  const practiceRangeChanged = requestedReplayGroupIndex !== (session.groupOnly ? session.groupIndex : null);
  const practiceStartPhaseChanged = selectedStartPhase !== (session.startPhase ?? "copy");
  const groupWords = session.originalWordIds.flatMap((id) => {
    const entry = words.find((candidate) => candidate.id === id);
    return entry ? [entry] : [];
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setProgress(readProgress(resilientBrowserStorage)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActivity(readLearningActivity(resilientBrowserStorage));
      setDailyGoal(readDailyGoal(resilientBrowserStorage));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const defaultNativeKeyboard = !window.matchMedia("(max-width: 760px)").matches;
      const preferences = readLearningPreferences(resilientBrowserStorage, defaultNativeKeyboard);
      setTranslationMode(preferences.translationMode);
      setNativeKeyboard(preferences.nativeKeyboard);
      setMuted(preferences.muted);
      setAutoConfirm(preferences.autoConfirm);
      setKeySound(preferences.keySound);
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    writeLearningPreferences(resilientBrowserStorage, { translationMode, nativeKeyboard, muted, autoConfirm, keySound });
  }, [autoConfirm, keySound, muted, nativeKeyboard, preferencesReady, translationMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const checkpoint = readLearningCheckpoint(resilientBrowserStorage, CHAPTERS);
      if (checkpoint) {
        setPracticeMode(checkpoint.practiceMode);
        setSelectedChapterId(checkpoint.selectedChapterId);
        setSelectedLessonId(checkpoint.selectedLessonId);
        setReviewWordIds(checkpoint.reviewWordIds);
        setSession(checkpoint.session);
        setMessage("已恢复上次练习");
        setStarted(true);
      }
      setCheckpointReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checkpointReady || !started) return;
    if (session.phase === "results" && !hasNextGroup) {
      clearLearningCheckpoint(resilientBrowserStorage);
      return;
    }
    writeLearningCheckpoint(resilientBrowserStorage, {
      practiceMode,
      selectedChapterId,
      selectedLessonId,
      reviewWordIds,
      session,
    });
  }, [checkpointReady, hasNextGroup, practiceMode, reviewWordIds, selectedChapterId, selectedLessonId, session, started]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const checkpoint = readLearningCheckpoint(resilientBrowserStorage, CHAPTERS);
      const location = checkpoint ? null : readLearningLocation(resilientBrowserStorage, CHAPTERS);
      if (location) {
        setSelectedChapterId(location.chapterId);
        setSelectedLessonId(location.lessonId);
      }
      setLocationReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!locationReady) return;
    writeLearningLocation(resilientBrowserStorage, selectedChapterId, selectedLessonId);
  }, [locationReady, selectedChapterId, selectedLessonId]);

  useEffect(() => {
    if (!started || muted || session.phase === "results") return;
    const timer = window.setTimeout(() => {
      void playKorean(word.id, word.korean).then((played) => {
        if (!played) setSpeechUnavailable(true);
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [started, word.id, word.korean, session.phase, muted]);

  useEffect(() => {
    if (!started || session.phase === "results") return;
    const timer = window.setTimeout(() => {
      if (shouldShowPracticeGuide(resilientBrowserStorage)) setShowPracticeHelp(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [session.phase, started]);

  useEffect(() => {
    const timer = window.setTimeout(() => setManualReveal(false), 0);
    return () => window.clearTimeout(timer);
  }, [session.phase, session.position, word.id]);

  useEffect(() => {
    if (!showGroupWords) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowGroupWords(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showGroupWords]);

  useEffect(() => {
    if (!showPracticeOptions) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPracticeOptions(false);
        practiceOptionsTriggerRef.current?.focus();
      }
    };
    practiceOptionsCloseRef.current?.focus();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showPracticeOptions]);

  useEffect(() => {
    if (!preferencesReady || !started || session.phase === "results") return;
    if (!nativeKeyboard) {
      inputRef.current?.blur();
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timer);
  }, [nativeKeyboard, preferencesReady, session.phase, session.position, started]);

  useEffect(() => {
    if (session.phase !== "results" || resultSaved || hasNextGroup) return;
    const timer = window.setTimeout(() => {
      const summary = summarizeLessonSession(session);
      const accuracy = practiceMode === "mistakes"
        ? Math.round(((words.length - session.mistakeIds.length) / words.length) * 100)
        : Math.round((summary.firstListenCorrect / summary.wordCount) * 100);
      const completedAt = new Date();
      setActivity(recordLearningActivity(resilientBrowserStorage, accuracy, completedAt));
      const previous = readProgress(resilientBrowserStorage);
      const updated = practiceMode === "mistakes"
        ? recordMistakeReview(previous, session.originalWordIds, session.mistakeIds, completedAt.toISOString())
        : session.groupOnly ? previous : recordLessonResult(previous, lesson.id, accuracy, summary.mistakeIds, completedAt.toISOString(), true);
      writeProgress(resilientBrowserStorage, updated);
      setProgress(updated);
      if (practiceMode === "lesson" && !session.groupOnly) {
        const milestone = getCoffeeTipMilestone(previous, updated, readCoffeeTipState(resilientBrowserStorage));
        if (milestone !== null) {
          markCoffeeTipShown(resilientBrowserStorage, milestone);
          setCoffeeTipMilestone(milestone);
        }
      }
      setResultSaved(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hasNextGroup, lesson.id, practiceMode, resultSaved, session, words.length]);

  function startLesson(lessonId = selectedLessonId, chapterId = selectedChapterId, options: { startPhase?: "copy" | "listen"; replayGroupIndex?: number } = {}) {
    const targetChapter = CHAPTERS.find((candidate) => candidate.id === chapterId) ?? CHAPTERS[0];
    const targetLesson = targetChapter.lessons.find((candidate) => candidate.id === lessonId) ?? targetChapter.lessons[0];
    const hasExplicitOptions = options.startPhase !== undefined || options.replayGroupIndex !== undefined;
    const canResume = practiceMode === "lesson"
      && selectedChapterId === targetChapter.id
      && selectedLessonId === targetLesson.id
      && (!hasExplicitOptions || ((session.startPhase ?? "copy") === (options.startPhase ?? "copy")
        && (session.groupOnly ? session.groupIndex : null) === (options.replayGroupIndex ?? null)))
      && canResumeLessonSession(session, targetLesson.words.map((item) => item.id));
    setPracticeMode("lesson");
    setSelectedChapterId(targetChapter.id);
    setSelectedLessonId(targetLesson.id);
    if (!canResume) setSession(createLessonSession(targetLesson.words.map((item) => item.id), options));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    submittingRef.current = false;
    setSubmitting(false);
    setShowGroupWords(false);
    setShowPracticeOptions(false);
    setResultSaved(false);
    setCoffeeTipMilestone(null);
    setShowCoffeeSupport(false);
    setStarted(true);
    if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function selectChapter(chapterId: string) {
    const targetChapter = CHAPTERS.find((candidate) => candidate.id === chapterId) ?? CHAPTERS[0];
    setSelectedChapterId(targetChapter.id);
    setSelectedLessonId(findChapterContinueLessonId(targetChapter, progress));
  }

  function openPracticeOptions() {
    setSelectedStartPhase(session.startPhase ?? "copy");
    setSelectedReplayGroupIndex(session.groupOnly ? session.groupIndex : null);
    setShowPracticeHelp(false);
    setShowGroupWords(false);
    setShowPracticeOptions(true);
    inputRef.current?.blur();
  }

  function applyPracticeOptions() {
    setShowPracticeOptions(false);
    if (practiceRangeChanged) startLesson(lesson.id, chapter.id, {
      startPhase: selectedStartPhase,
      ...(requestedReplayGroupIndex !== null ? { replayGroupIndex: requestedReplayGroupIndex } : {}),
    });
    else if (practiceStartPhaseChanged) {
      setSession((current) => restartCurrentLessonGroup(current, selectedStartPhase));
      setAnswer("");
      setKeyboardJamo("");
      setMessage("");
      setManualReveal(false);
      setShowGroupWords(false);
      submittingRef.current = false;
      setSubmitting(false);
      if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
      else practiceOptionsTriggerRef.current?.focus();
    }
    else if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
    else practiceOptionsTriggerRef.current?.focus();
  }

  function startMistakeReview(wordIds: string[]) {
    if (!wordIds.length) return;
    setPracticeMode("mistakes");
    setReviewWordIds(wordIds);
    setSession(createReviewSession(wordIds));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    submittingRef.current = false;
    setSubmitting(false);
    setShowGroupWords(false);
    setResultSaved(false);
    setStarted(true);
    if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function startNextGroup() {
    setSession((current) => advanceLessonGroup(current));
    setAnswer("");
    setKeyboardJamo("");
    setMessage("");
    submittingRef.current = false;
    setSubmitting(false);
    setShowGroupWords(false);
    if (nativeKeyboard) window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  function submit(submittedAnswer = answer) {
    if (submittingRef.current) return;
    if (submittedAnswer.trim()) markWordStudied();
    if (isExactSpelling(submittedAnswer, word.korean)) {
      submittingRef.current = true;
      setSubmitting(true);
      setShowPracticeHelp(false);
      setMessage("정답이에요! 拼写正确");
      window.setTimeout(() => {
        setSession((current) => submitLessonAnswer(current, word.id, true));
        setAnswer("");
        setKeyboardJamo("");
        setMessage("");
        submittingRef.current = false;
        setSubmitting(false);
      }, CORRECT_ADVANCE_DELAY_MS);
    } else {
      const isNewLessonMistake = practiceMode === "lesson"
        && session.phase !== "copy"
        && !session.mistakeIds.includes(word.id);
      if (isNewLessonMistake) {
        setProgress((current) => {
          const updated = recordLessonMistake(current, lesson.id, word.id);
          writeProgress(resilientBrowserStorage, updated);
          return updated;
        });
      }
      setSession((current) => submitLessonAnswer(current, word.id, false));
      const nextErrorCount = session.currentErrorCount + 1;
      setMessage(session.phase !== "copy" && nextErrorCount >= SPELLING_REVEAL_ERROR_LIMIT
        ? `已显示答案（${SPELLING_REVEAL_ERROR_LIMIT}/${SPELLING_REVEAL_ERROR_LIMIT}），请重新输入正确拼写`
        : session.phase !== "copy"
          ? `这次拼写不正确（${nextErrorCount}/${SPELLING_REVEAL_ERROR_LIMIT}）。红色是错误部分，可再听一次或点“不会写？”`
          : "红色部分不正确，请按删除键后重新输入");
      if (!muted) {
        void playKorean(word.id, word.korean).then((played) => {
          if (!played) setSpeechUnavailable(true);
        });
      }
    }
  }

  function typeKey(key: string) {
    if (submittingRef.current) return;
    if (keySound) playKeyboardSound("key");
    const next = keyboardJamo + key;
    const nextAnswer = composeHangul(next, word.korean);
    if (nextAnswer) markWordStudied();
    setKeyboardJamo(next);
    setAnswer(nextAnswer);
    if (autoConfirm && isExactSpelling(nextAnswer, word.korean)) submit(nextAnswer);
  }

  function deleteKey() {
    if (keySound) playKeyboardSound("delete");
    if (keyboardJamo) {
      const next = keyboardJamo.slice(0, -1);
      setKeyboardJamo(next);
      setAnswer(composeHangul(next, word.korean));
    } else {
      setAnswer((current) => current.slice(0, -1));
    }
  }

  function closePracticeHelp() {
    markPracticeGuideSeen(resilientBrowserStorage);
    setShowPracticeHelp(false);
  }

  function revealCurrentSpelling() {
    if (manualReveal) {
      closePracticeHelp();
      return;
    }
    markWordStudied();
    setManualReveal(true);
    closePracticeHelp();
    setMessage(session.phase === "copy"
      ? "请照着韩文答案重新拼写；这是韩文拼写，不是罗马音"
      : "已显示韩文答案，本词会按错词记录；请照着答案重新拼写");
    if (session.phase === "copy") return;

    const isNewLessonMistake = practiceMode === "lesson" && !session.mistakeIds.includes(word.id);
    if (isNewLessonMistake) {
      setProgress((current) => {
        const updated = recordLessonMistake(current, lesson.id, word.id);
        writeProgress(resilientBrowserStorage, updated);
        return updated;
      });
    }
    setSession((current) => submitLessonAnswer(current, word.id, false));
  }

  function markWordStudied() {
    setActivity(recordStudiedWord(resilientBrowserStorage, word.id));
  }

  function downloadLearningBackup() {
    const content = createLearningBackup(resilientBrowserStorage, CHAPTERS);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubekorean-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setBackupMessage("备份已下载，请妥善保存文件。");
    setResetArmed(false);
  }

  async function importLearningBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      restoreLearningBackup(resilientBrowserStorage, CHAPTERS, await file.text());
      window.location.reload();
    } catch {
      setBackupMessage("无法恢复：请选择由当前版本 CubeKorean 导出的有效备份。");
      setResetArmed(false);
    }
  }

  function resetLearningData() {
    if (!resetArmed) {
      setResetArmed(true);
      setBackupMessage("此操作会清空本机进度和错词。请再次点击确认。");
      return;
    }
    clearAllLearningData(resilientBrowserStorage);
    window.location.reload();
  }

  function optOutOfCoffeeTips() {
    dismissFutureCoffeeTips(resilientBrowserStorage);
    setCoffeeTipMilestone(null);
  }

  const closeCoffeeSupport = useCallback(() => setShowCoffeeSupport(false), []);

  if (!started && showDataCenter) {
    return (
      <LearningDataPage
        learningStats={learningStats}
        activitySummary={activitySummary}
        progress={progress}
        dailyGoal={dailyGoal}
        totalLessonCount={TOTAL_LESSON_COUNT}
        backupMessage={backupMessage}
        resetArmed={resetArmed}
        backupInputRef={backupInputRef}
        showCoffeeSupport={showCoffeeSupport}
        onBack={() => {
          setShowDataCenter(false);
          setResetArmed(false);
          setBackupMessage("");
        }}
        onDailyGoalChange={(goal) => {
          setDailyGoal(goal);
          writeDailyGoal(resilientBrowserStorage, goal);
        }}
        onOpenCoffeeSupport={() => setShowCoffeeSupport(true)}
        onCloseCoffeeSupport={closeCoffeeSupport}
        onDownloadBackup={downloadLearningBackup}
        onChooseBackup={() => backupInputRef.current?.click()}
        onImportBackup={importLearningBackup}
        onResetLearningData={resetLearningData}
      />
    );
  }

  if (!started && showMistakeBook) {
    return (
      <MistakeBookPage
        progress={progress}
        chapterFilter={mistakeChapterFilter}
        lessonFilter={mistakeLessonFilter}
        onBack={() => setShowMistakeBook(false)}
        onChapterFilterChange={(chapterId) => {
          setMistakeChapterFilter(chapterId);
          setMistakeLessonFilter("all");
        }}
        onLessonFilterChange={setMistakeLessonFilter}
        onStartReview={startMistakeReview}
      />
    );
  }

  if (!started) {
    return (
      <CourseMapPage
        selectedChapterId={selectedChapterId}
        selectedLessonId={selectedLessonId}
        progress={progress}
        checkpointReady={checkpointReady}
        todayWords={activitySummary.today.words}
        onSelectChapter={selectChapter}
        onSelectLesson={setSelectedLessonId}
        onStartLesson={() => startLesson()}
        onOpenMistakeBook={() => setShowMistakeBook(true)}
        onOpenDataCenter={() => setShowDataCenter(true)}
      />
    );
  }

  if (session.phase === "results") {
    const nextLesson = lessons[lessons.findIndex((item) => item.id === lesson.id) + 1];
    const isGroupComplete = practiceMode === "lesson" && hasNextGroup;
    return (
      <LessonResultsPage
        practiceMode={practiceMode}
        session={session}
        words={words}
        lesson={lesson}
        nextLesson={nextLesson}
        hasNextGroup={hasNextGroup}
        completedLessonCount={Object.keys(progress.lessons).length}
        coffeeTipMilestone={coffeeTipMilestone}
        showCoffeeSupport={showCoffeeSupport}
        onContinue={() => {
          if (isGroupComplete) startNextGroup();
          else if (practiceMode === "mistakes" || session.groupOnly) setStarted(false);
          else if (nextLesson) startLesson(nextLesson.id);
          else startLesson();
        }}
        onReturn={() => {
          setStarted(false);
          if (practiceMode === "mistakes") setShowMistakeBook(false);
        }}
        onOpenCoffeeSupport={() => setShowCoffeeSupport(true)}
        onCloseCoffeeSupport={closeCoffeeSupport}
        onCloseCoffeeTip={() => setCoffeeTipMilestone(null)}
        onOptOutCoffeeTips={optOutOfCoffeeTips}
      />
    );
  }

  const groupTotal = session.groupSize ? Math.ceil(session.allWordIds.length / session.groupSize) : 1;
  const closePracticeOptions = () => {
    setShowPracticeOptions(false);
    practiceOptionsTriggerRef.current?.focus();
  };

  return (
    <main
      className="practice-page"
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest(".group-list-trigger,.group-word-list,.group-list-backdrop,.practice-options-trigger,.practice-options-dialog,.practice-options-backdrop,.translation-mode-select")) return;
        if (nativeKeyboard) inputRef.current?.focus({ preventScroll: true });
      }}
    >
      {practiceMode === "lesson" && (
        <GroupWordList
          open={showGroupWords}
          groupIndex={session.groupIndex}
          groupTotal={groupTotal}
          words={groupWords}
          currentWordId={word.id}
          onOpen={() => {
            setShowPracticeHelp(false);
            setShowGroupWords(true);
          }}
          onClose={() => setShowGroupWords(false)}
          onSpeechUnavailable={() => setSpeechUnavailable(true)}
        />
      )}
      <PracticeHeader
        session={session}
        groupTotal={groupTotal}
        practiceMode={practiceMode}
        submitting={submitting}
        optionsOpen={showPracticeOptions}
        optionsTriggerRef={practiceOptionsTriggerRef}
        onExit={() => setStarted(false)}
        onOpenOptions={openPracticeOptions}
      />
      <PracticeOptionsDialog
        open={showPracticeOptions && practiceMode === "lesson"}
        closeRef={practiceOptionsCloseRef}
        selectedStartPhase={selectedStartPhase}
        selectedReplayGroupIndex={selectedReplayGroupIndex}
        lessonCompleted={Boolean(progress.lessons[lesson.id])}
        lessonWordCount={lesson.words.length}
        groupIndex={session.groupIndex}
        startPhaseChanged={practiceStartPhaseChanged}
        rangeChanged={practiceRangeChanged}
        onStartPhaseChange={setSelectedStartPhase}
        onReplayGroupChange={setSelectedReplayGroupIndex}
        onClose={closePracticeOptions}
        onApply={applyPracticeOptions}
      />
      <PracticeWordStage
        word={word}
        session={session}
        answer={answer}
        message={message}
        nativeKeyboard={nativeKeyboard}
        translationMode={translationMode}
        manualReveal={manualReveal}
        showHelp={showPracticeHelp}
        speechUnavailable={speechUnavailable}
        submitting={submitting}
        inputRef={inputRef}
        onAnswerChange={(value) => {
          setKeyboardJamo("");
          setAnswer(value);
        }}
        onSubmit={() => submit()}
        onMarkStudied={markWordStudied}
        onToggleHelp={() => {
          setShowGroupWords(false);
          setShowPracticeHelp((current) => !current);
        }}
        onCloseHelp={closePracticeHelp}
        onRevealSpelling={revealCurrentSpelling}
        onSpeechUnavailable={() => setSpeechUnavailable(true)}
      />
      <HangulKeyboard
        nativeKeyboard={nativeKeyboard}
        muted={muted}
        autoConfirm={autoConfirm}
        keySound={keySound}
        translationMode={translationMode}
        answer={answer}
        submitting={submitting}
        inputRef={inputRef}
        onToggleMuted={() => setMuted((current) => !current)}
        onTranslationModeChange={setTranslationMode}
        onToggleAutoConfirm={() => setAutoConfirm((current) => !current)}
        onToggleKeySound={() => setKeySound((current) => {
          const enabled = !current;
          if (enabled) playKeyboardSound("key");
          return enabled;
        })}
        onResetAnswer={() => {
          setAnswer("");
          setKeyboardJamo("");
          setMessage("");
        }}
        onTypeKey={typeKey}
        onDeleteKey={deleteKey}
        onToggleNativeKeyboard={(useNativeKeyboard) => {
          setNativeKeyboard(useNativeKeyboard);
          if (useNativeKeyboard) setKeyboardJamo("");
        }}
        onSubmit={() => submit()}
      />
    </main>
  );
}
