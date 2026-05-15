# ポモドーロタイマー実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 25分作業→5分休憩を自動切り替えするタイマーを実装し、作業セッション完了時にDBへ記録する

**Architecture:** `useTimer`フックでタイマーロジックとlocalStorage永続化を管理、`useSound`でWeb Audio APIによるマリンバ音を再生、`PomodoroTimer`コンポーネントがSVG円形プログレスリングのUIを描画してServer Actionでセッション完了をDBに保存する

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL), Web Audio API, Notification API

---

## ファイル構成

| ファイル | 役割 |
|--------|------|
| `src/lib/actions/study-logs.ts` | Server Action: study_logsにinsert、daily_statsをupsert |
| `src/app/timer/useTimer.ts` | カウントダウンロジック、モード切り替え、localStorage読み書き |
| `src/app/timer/useSound.ts` | Web Audio APIでマリンバ風チャイムを生成・再生 |
| `src/app/timer/PomodoroTimer.tsx` | メインUIクライアントコンポーネント（SVG進捗リング）|
| `src/app/timer/page.tsx` | サーバーコンポーネント（認証チェック） |
| `src/app/page.tsx` | 既存ホームページにタイマーリンクを追加 |

---

## Task 1: study-logsサーバーアクション

**Files:**
- Create: `src/lib/actions/study-logs.ts`

- [ ] **Step 1: ファイルを作成する**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStudyLog(startedAt: string, endedAt: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("study_logs").insert({
    user_id: user.id,
    duration_minutes: 25,
    mode: "work",
    started_at: startedAt,
    ended_at: endedAt,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("daily_stats")
    .select("total_minutes")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    await supabase
      .from("daily_stats")
      .update({
        total_minutes: existing.total_minutes + 25,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("date", today);
  } else {
    await supabase.from("daily_stats").insert({
      user_id: user.id,
      date: today,
      total_minutes: 25,
    });
  }
}
```

- [ ] **Step 2: TypeScriptのエラーがないか確認する**

```bash
cd /Users/kudo/Stupomo
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/lib/actions/study-logs.ts
git commit -m "study-logsサーバーアクションを追加"
```

---

## Task 2: useTimerフック

**Files:**
- Create: `src/app/timer/useTimer.ts`

- [ ] **Step 1: ファイルを作成する**

```typescript
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
```

- [ ] **Step 2: TypeScriptのエラーがないか確認する**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/app/timer/useTimer.ts
git commit -m "useTimerフックを追加"
```

---

## Task 3: useSoundフック

**Files:**
- Create: `src/app/timer/useSound.ts`

- [ ] **Step 1: ファイルを作成する**

```typescript
"use client";

import { useCallback, useRef } from "react";

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    // マリンバ風: G5(784Hz)とD6(1174Hz)を少しずらして鳴らす
    const notes: [number, number][] = [
      [784, 0],
      [1174, 0.12],
    ];

    notes.forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      osc.start(t);
      osc.stop(t + 1.0);
    });
  }, []);

  return { playChime };
}
```

- [ ] **Step 2: TypeScriptのエラーがないか確認する**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/app/timer/useSound.ts
git commit -m "useSoundフックを追加（Web Audio APIマリンバ音）"
```

---

## Task 4: PomodoroTimerコンポーネント

**Files:**
- Create: `src/app/timer/PomodoroTimer.tsx`

- [ ] **Step 1: ファイルを作成する**

```typescript
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

export default function PomodoroTimer() {
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

  const totalDuration =
    state.mode === "work" ? WORK_DURATION : BREAK_DURATION;
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
        <div className="relative mx-auto mb-4 flex items-center justify-content-center"
          style={{ width: 192, height: 192 }}>
          <svg
            width={192}
            height={192}
            className="absolute top-0 left-0"
          >
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
        <p className="mb-6 text-sm text-gray-500">
          セット{" "}
          <span className="font-bold text-gray-900">{state.sessionCount}</span>{" "}
          / 4
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
```

- [ ] **Step 2: TypeScriptのエラーがないか確認する**

```bash
npx tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/app/timer/PomodoroTimer.tsx
git commit -m "PomodoroTimerコンポーネントを追加"
```

---

## Task 5: タイマーページ

**Files:**
- Create: `src/app/timer/page.tsx`

- [ ] **Step 1: ファイルを作成する**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PomodoroTimer from "./PomodoroTimer";

export default async function TimerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <PomodoroTimer />;
}
```

- [ ] **Step 2: 開発サーバーを起動して動作確認する**

```bash
docker compose up
```

ブラウザで http://localhost:3001/timer を開く。

確認項目:
- 未ログイン状態で `/timer` にアクセスすると `/login` にリダイレクトされること
- ログイン済みでタイマー画面が表示されること
- 円形プログレスリングと「25:00 / 作業中 / セット 1 / 4」が表示されること
- 「開始」ボタンを押すとカウントダウンが始まること（通知許可ダイアログが出る）
- 「停止」ボタンで止まること
- 「リセット」ボタンで 25:00 に戻ること
- ページリロード後にカウントダウン中の状態が復元されること

- [ ] **Step 3: コミットする**

```bash
git add src/app/timer/page.tsx
git commit -m "タイマーページを追加"
```

---

## Task 6: ホームページにタイマーリンクを追加

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: page.tsx を修正する**

`src/app/page.tsx` の `<LogoutButton />` の前にリンクを追加する:

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Stupomo</h1>
        <p className="text-sm text-gray-500 mb-8">ログイン中: {user.email}</p>
        <Link
          href="/timer"
          className="mb-4 flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-600"
        >
          タイマーを開始する
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ブラウザで動作確認する**

http://localhost:3001 を開く。

確認項目:
- 「タイマーを開始する」ボタンが表示されること
- クリックで `/timer` に遷移すること

- [ ] **Step 3: コミットする**

```bash
git add src/app/page.tsx
git commit -m "ホームページにタイマーへのリンクを追加"
```

---

## Task 7: DB保存の動作確認

- [ ] **Step 1: タイマーを短縮して動作確認する**

`src/app/timer/useTimer.ts` を一時的に書き換えて動作確認する:

```typescript
// 確認用に短縮（確認後に元に戻す）
const WORK_DURATION = 10; // 10秒
const BREAK_DURATION = 5;  // 5秒
```

- [ ] **Step 2: タイマーを動かしてセッションを完了させる**

1. http://localhost:3001/timer でタイマーを開始
2. 10秒待って作業セッションが完了し、休憩に自動切り替えされることを確認
3. マリンバ音とブラウザ通知が出ることを確認

- [ ] **Step 3: DBに記録されているか確認する**

```bash
supabase db diff --local
```

または Supabase Studio (http://127.0.0.1:54323) の Table Editor で `study_logs` と `daily_stats` テーブルを確認する。

期待:
- `study_logs` に1件レコードが追加されている
- `daily_stats` に当日分のレコードが追加されている

- [ ] **Step 4: タイマー時間を元に戻す**

`src/app/timer/useTimer.ts` を元の値に戻す:

```typescript
const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
```

- [ ] **Step 5: 最終コミットする**

```bash
git add src/app/timer/useTimer.ts
git commit -m "動作確認用の時間設定を本番値に戻す"
```
