# 学習記録機能 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** タイマー画面に今日の学習合計を表示し、/records ページで日別学習履歴を確認できるようにする

**Architecture:** timer/page.tsx（Server Component）で daily_stats を取得して PomodoroTimer に props 渡し、revalidatePath でセッション完了後に自動更新。/records ページは Server Component でデータ取得し、展開UI は Client Component（StudyRecords）に委譲する

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL), `next/cache` の revalidatePath

---

## ファイル構成

| ファイル | 変更種別 | 役割 |
|--------|---------|------|
| `src/lib/actions/study-logs.ts` | 変更 | saveStudyLog に revalidatePath("/timer") を追加 |
| `src/app/timer/page.tsx` | 変更 | daily_stats から今日の合計を取得し PomodoroTimer に渡す |
| `src/app/timer/PomodoroTimer.tsx` | 変更 | todayMinutes prop を受け取りタイマー上部に表示 |
| `src/app/records/page.tsx` | 新規 | daily_stats 全件取得・認証チェック |
| `src/app/records/StudyRecords.tsx` | 新規 | 日別展開UIクライアントコンポーネント |
| `src/app/page.tsx` | 変更 | ホームページに「学習履歴」リンクを追加 |

---

## Task 1: saveStudyLog に revalidatePath を追加

**Files:**
- Modify: `src/lib/actions/study-logs.ts`

- [ ] **Step 1: ファイルを以下の内容に書き換える**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/timer");
}
```

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
node_modules/.bin/tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/lib/actions/study-logs.ts
git commit -m "saveStudyLogにrevalidatePathを追加"
```

---

## Task 2: timer/page.tsx に今日の合計取得を追加

**Files:**
- Modify: `src/app/timer/page.tsx`

- [ ] **Step 1: ファイルを以下の内容に書き換える**

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

  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_stats")
    .select("total_minutes")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const todayMinutes = data?.total_minutes ?? 0;

  return <PomodoroTimer todayMinutes={todayMinutes} />;
}
```

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
node_modules/.bin/tsc --noEmit
```

期待: PomodoroTimer が todayMinutes prop を受け取っていないためエラーになる（次のタスクで修正）

- [ ] **Step 3: コミットせず次のタスクへ進む**

---

## Task 3: PomodoroTimer.tsx に todayMinutes を表示

**Files:**
- Modify: `src/app/timer/PomodoroTimer.tsx`

- [ ] **Step 1: ファイルを以下の内容に書き換える**

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

interface Props {
  todayMinutes: number;
}

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
        {/* 今日の学習合計 */}
        <p className="mb-6 text-sm font-semibold text-indigo-500 tracking-wide">
          今日の学習 {todayMinutes}分
        </p>

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

- [ ] **Step 2: TypeScript エラーがないか確認する**

```bash
node_modules/.bin/tsc --noEmit
```

期待: エラーなし

- [ ] **Step 3: ブラウザで動作確認する**

http://localhost:3001/timer を開く。

確認項目:
- タイマーの上に「今日の学習 ○分」が表示されること
- 数値は `daily_stats` の値と一致すること（Supabase Studio で確認）

- [ ] **Step 4: コミットする**

```bash
git add src/lib/actions/study-logs.ts src/app/timer/page.tsx src/app/timer/PomodoroTimer.tsx
git commit -m "タイマー画面に今日の学習合計時間を表示"
```

---

## Task 4: 学習履歴ページを作成

**Files:**
- Create: `src/app/records/page.tsx`
- Create: `src/app/records/StudyRecords.tsx`

- [ ] **Step 1: `src/app/records/page.tsx` を作成する**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudyRecords from "./StudyRecords";

export default async function RecordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: dailyStats } = await supabase
    .from("daily_stats")
    .select("id, date, total_minutes")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8edf8 40%, #ede8f5 100%)",
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">学習履歴</h1>
          <Link
            href="/timer"
            className="text-sm text-indigo-500 hover:text-indigo-600"
          >
            ← タイマーに戻る
          </Link>
        </div>
        <StudyRecords dailyStats={dailyStats ?? []} userId={user.id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `src/app/records/StudyRecords.tsx` を作成する**

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DailyStat {
  id: string;
  date: string;
  total_minutes: number;
}

interface Session {
  id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
}

interface Props {
  dailyStats: DailyStat[];
  userId: string;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${year}年${month}月${day}日`;
}

export default function StudyRecords({ dailyStats, userId }: Props) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      return;
    }

    setExpandedDate(date);

    if (sessions[date]) return;

    setLoading(date);
    const supabase = createClient();
    const { data } = await supabase
      .from("study_logs")
      .select("id, started_at, ended_at, duration_minutes")
      .eq("user_id", userId)
      .gte("started_at", `${date}T00:00:00`)
      .lte("started_at", `${date}T23:59:59`)
      .order("started_at", { ascending: true });

    setSessions((prev) => ({ ...prev, [date]: data ?? [] }));
    setLoading(null);
  };

  if (dailyStats.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400">
        まだ学習記録がありません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dailyStats.map((stat) => (
        <div
          key={stat.id}
          className="overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <button
            onClick={() => handleToggle(stat.date)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">
              {formatDate(stat.date)}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-indigo-500">
                {stat.total_minutes}分
              </span>
              <span className="text-xs text-gray-400">
                {expandedDate === stat.date ? "▲" : "▼"}
              </span>
            </div>
          </button>

          {expandedDate === stat.date && (
            <div className="border-t border-gray-100 px-5 py-3">
              {loading === stat.date ? (
                <p className="text-sm text-gray-400">読み込み中...</p>
              ) : (sessions[stat.date] ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">記録がありません</p>
              ) : (
                <ul className="space-y-2">
                  {(sessions[stat.date] ?? []).map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between text-sm text-gray-600"
                    >
                      <span>
                        {formatTime(session.started_at)} 〜{" "}
                        {formatTime(session.ended_at)}
                      </span>
                      <span className="text-gray-400">
                        {session.duration_minutes}分
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: TypeScript エラーがないか確認する**

```bash
node_modules/.bin/tsc --noEmit
```

期待: エラーなし

- [ ] **Step 4: ブラウザで動作確認する**

http://localhost:3001/records を開く。

確認項目:
- 日付と合計分数が一覧表示されること
- 日付をクリックするとセッション詳細が展開されること
- もう一度クリックすると閉じること
- 「← タイマーに戻る」リンクで /timer に遷移すること

- [ ] **Step 5: コミットする**

```bash
git add src/app/records/page.tsx src/app/records/StudyRecords.tsx
git commit -m "学習履歴ページを追加"
```

---

## Task 5: ホームページに履歴リンクを追加

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: ファイルを以下の内容に書き換える**

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
        <div className="flex flex-col gap-3 mb-4">
          <Link
            href="/timer"
            className="flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-600"
          >
            タイマーを開始する
          </Link>
          <Link
            href="/records"
            className="flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-500 transition hover:bg-indigo-50"
          >
            学習履歴を見る
          </Link>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ブラウザで動作確認する**

http://localhost:3001 を開く。

確認項目:
- 「タイマーを開始する」と「学習履歴を見る」の2ボタンが表示されること
- 「学習履歴を見る」で /records に遷移すること

- [ ] **Step 3: コミットする**

```bash
git add src/app/page.tsx
git commit -m "ホームページに学習履歴リンクを追加"
```
