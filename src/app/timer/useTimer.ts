"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Mode = "work" | "break";

interface TimerState {
  mode: Mode;
  timeLeft: number;
  isRunning: boolean;
  sessionCount: number;
}

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const STORAGE_KEY = "stupomo_timer_state";

const defaultState: TimerState = {
  mode: "work",
  timeLeft: WORK_DURATION,
  isRunning: false,
  sessionCount: 1,
};

function loadState(): TimerState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as TimerState;
  } catch {
    // ignore
  }
  return defaultState;
}

function saveState(state: TimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useTimer(onSessionComplete: (isWork: boolean) => void) {
  const [state, setState] = useState<TimerState>(defaultState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSessionCompleteRef = useRef(onSessionComplete);

  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  // localStorageから復元
  useEffect(() => {
    setState(loadState());
  }, []);

  // localStorageへ保存
  useEffect(() => {
    saveState(state);
  }, [state]);

  // カウントダウン
  useEffect(() => {
    if (!state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeLeft > 1) {
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        }

        // セッション完了
        const isWork = prev.mode === "work";
        setTimeout(() => onSessionCompleteRef.current(isWork), 0);

        const nextMode: Mode = isWork ? "break" : "work";
        const nextTime = nextMode === "work" ? WORK_DURATION : BREAK_DURATION;
        const nextSession =
          nextMode === "work"
            ? prev.sessionCount >= 4
              ? 1
              : prev.sessionCount + 1
            : prev.sessionCount;

        return {
          mode: nextMode,
          timeLeft: nextTime,
          isRunning: true,
          sessionCount: nextSession,
        };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const start = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const stop = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
  }, []);

  return { state, start, stop, reset };
}
