"use client";

import { useCallback, useRef } from "react";
import { useTimer } from "./useTimer";
import { useSound } from "./useSound";
import { saveStudyLog } from "@/lib/actions/study-logs";

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type Props = {
  todayMinutes: number;
};

export default function PomodoroTimer({ todayMinutes }: Props) {
  const workStartedAtRef = useRef<string | null>(null);
  const { playChime } = useSound();

  const handleSessionComplete = useCallback(
    (isWork: boolean) => {
      playChime();

      if (Notification.permission === "granted") {
        new Notification(isWork ? "作業セッション完了！" : "休憩終了！", {
          body: isWork ? "休憩しましょう。" : "作業を再開しましょう。",
        });
      }

      if (isWork && workStartedAtRef.current) {
        saveStudyLog(workStartedAtRef.current, new Date().toISOString());
        workStartedAtRef.current = null;
      }
    },
    [playChime]
  );

  const { state, start, stop, reset } = useTimer(handleSessionComplete);

  const totalDuration = state.mode === "work" ? WORK_DURATION : BREAK_DURATION;
  const progress = (totalDuration - state.timeLeft) / totalDuration;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const handleStart = () => {
    if (state.mode === "work" && !workStartedAtRef.current) {
      workStartedAtRef.current = new Date().toISOString();
    }
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    start();
  };

  const handleReset = () => {
    workStartedAtRef.current = null;
    reset();
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8edf8 40%, #ede8f5 100%)",
      }}
    >
      <div className="text-center">
        {/* 円形プログレスリング */}
        <div
          className="relative mx-auto mb-4"
          style={{ width: 192, height: 192 }}
        >
          <svg width={192} height={192} className="absolute top-0 left-0">
            <circle
              cx={96}
              cy={96}
              r={RADIUS}
              fill="none"
              stroke="rgba(99,102,241,0.15)"
              strokeWidth={8}
            />
            <circle
              cx={96}
              cy={96}
              r={RADIUS}
              fill="none"
              stroke="#6366F1"
              strokeWidth={8}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 96 96)`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tracking-widest text-gray-900">
              {formatTime(state.timeLeft)}
            </span>
            <span className="mt-1 text-xs text-gray-400">
              {state.mode === "work" ? "作業中" : "休憩中"}
            </span>
          </div>
        </div>

        {/* セッションカウンター */}
        <p className="mb-2 text-sm text-gray-500">
          セット{" "}
          <span className="font-bold text-gray-900">{state.sessionCount}</span>{" "}
          / 4
        </p>

        {/* 今日の学習時間 */}
        <p className="mb-6 text-sm text-gray-500">
          今日の学習時間:{" "}
          <span className="font-bold text-gray-900">{todayMinutes}</span> 分
        </p>

        {/* ボタン */}
        <div className="flex justify-center gap-3">
          {state.isRunning ? (
            <button
              onClick={stop}
              className="rounded-lg bg-indigo-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-indigo-600"
            >
              停止
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="rounded-lg bg-indigo-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-indigo-600"
            >
              開始
            </button>
          )}
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  );
}
