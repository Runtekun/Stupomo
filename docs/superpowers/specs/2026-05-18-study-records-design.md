# 学習記録機能 設計書

## 概要

タイマー画面に今日の学習合計時間を表示し、別ページで日別の学習履歴を確認できる機能。

---

## 機能概要

### 1. 今日の合計時間（タイマー画面）

- `/timer` ページの円形タイマーの上に「今日の学習 ○分」を表示
- `daily_stats` テーブルから当日のレコードを取得
- セッション完了時（Server Action）に `revalidatePath("/timer")` で自動更新
- データがない場合は「今日の学習 0分」と表示

### 2. 学習履歴ページ（`/records`）

- `daily_stats` を日付降順で一覧表示（日付・合計時間）
- 各日をクリックすると `study_logs` のセッション詳細を展開
- セッション詳細: 開始時刻・終了時刻・25分（固定）
- 認証チェックあり（未ログインは `/login` にリダイレクト）

---

## アーキテクチャ

Server Components でデータ取得し、インタラクション部分だけ Client Component に委譲する。

```
/timer
  page.tsx（Server Component）
    → daily_stats から今日の合計を取得
    → PomodoroTimer に todayMinutes: number を渡す
  PomodoroTimer.tsx（Client Component）
    → タイマー上部に todayMinutes を表示

/records
  page.tsx（Server Component）
    → daily_stats を日付降順で全件取得
    → StudyRecords に渡す
  StudyRecords.tsx（Client Component）
    → 日別リストを表示
    → クリックで study_logs を取得して展開
```

---

## コンポーネント構成

| ファイル | 変更種別 | 役割 |
|--------|---------|------|
| `src/app/timer/page.tsx` | 変更 | daily_stats から今日の合計を取得し PomodoroTimer に渡す |
| `src/app/timer/PomodoroTimer.tsx` | 変更 | props で受け取った todayMinutes をタイマー上部に表示 |
| `src/lib/actions/study-logs.ts` | 変更 | saveStudyLog に revalidatePath("/timer") を追加 |
| `src/app/records/page.tsx` | 新規 | daily_stats 全件取得・認証チェック |
| `src/app/records/StudyRecords.tsx` | 新規 | 日別展開UIクライアントコンポーネント |
| `src/app/page.tsx` | 変更 | ホームページに「学習履歴」リンクを追加 |

---

## データ取得

### 今日の合計（timer/page.tsx）

```typescript
const today = new Date().toISOString().split("T")[0];
const { data } = await supabase
  .from("daily_stats")
  .select("total_minutes")
  .eq("user_id", user.id)
  .eq("date", today)
  .single();
const todayMinutes = data?.total_minutes ?? 0;
```

### 履歴一覧（records/page.tsx）

```typescript
const { data: dailyStats } = await supabase
  .from("daily_stats")
  .select("id, date, total_minutes")
  .eq("user_id", user.id)
  .order("date", { ascending: false });
```

### セッション詳細（StudyRecords.tsx クライアント側）

```typescript
const { data: sessions } = await supabase
  .from("study_logs")
  .select("id, started_at, ended_at, duration_minutes")
  .eq("user_id", user.id)
  .gte("started_at", `${date}T00:00:00`)
  .lte("started_at", `${date}T23:59:59`)
  .order("started_at", { ascending: true });
```

---

## UI詳細

### タイマー画面

```
今日の学習 50分          ← daily_stats から取得
   [円形プログレスリング]
        25:00
        作業中
  セット 1 / 4
  [開始] [リセット]
```

### 履歴ページ

```
学習履歴

2026-05-18  75分
  ▶ クリックで展開
    09:00〜09:25  25分
    10:00〜10:25  25分
    11:00〜11:25  25分

2026-05-17  50分
  ▶ クリックで展開
    ...
```

---

## ナビゲーション

- `src/app/page.tsx`（ホーム）に「学習履歴」ボタンを追加（`/records` へのリンク）
- `src/app/records/page.tsx` から `/timer` へ戻るリンクを設置
