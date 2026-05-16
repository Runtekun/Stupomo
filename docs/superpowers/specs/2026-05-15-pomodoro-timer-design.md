# ポモドーロタイマー機能 設計書

## 概要

Stupomo のコア機能であるポモドーロタイマー。25分の作業セッションと5分の休憩を自動で切り替え、セッション完了時に学習記録を DB へ保存する。

---

## UI / ビジュアル

### レイアウト
- 円形プログレスリング（残り時間を進捗として視覚化）
- リング中央に時刻（MM:SS）とモード名（作業中 / 休憩中）を表示
- リング下に「セット N / 4」テキストカウンター
- 開始 / 停止 / リセット ボタン

### カラー
| モード | ゲージ色 |
|--------|---------|
| ライト | `#6366F1`（インディゴ） |
| ダーク  | `#818CF8`（明るいインディゴ） |

### 背景
- ソフトグラデーション: `linear-gradient(135deg, #f0f4ff, #e8edf8, #ede8f5)`
- ダークモードは後フェーズで対応

---

## タイマー動作

- **作業セッション**: 25分（1500秒）
- **休憩セッション**: 5分（300秒）
- 作業完了 → 自動で休憩に切り替え
- 休憩完了 → 自動で次の作業に切り替え
- 4セット完了でカウンターリセット（1に戻る）

---

## 通知 / サウンド

- 作業・休憩の切り替え時に **マリンバ音**（Web Audio API で生成）
- 同タイミングで **ブラウザ通知**（Notification API）
- 初回起動時に通知許可を要求

---

## 状態管理 / 永続化

### 状態
```ts
type TimerState = {
  mode: 'work' | 'break';
  timeLeft: number;      // 残り秒数
  isRunning: boolean;
  sessionCount: number;  // 1〜4
}
```

### localStorage
- キー: `stupomo_timer_state`
- タイマー起動中はページリロード後も状態を復元
- リセット時は localStorage もクリア

---

## コンポーネント構成

```
src/app/timer/
├── page.tsx              # サーバーコンポーネント（認証チェック・リダイレクト）
├── PomodoroTimer.tsx     # メインUIクライアントコンポーネント
├── useTimer.ts           # タイマーロジック（useState / useEffect / localStorage）
└── useSound.ts           # Web Audio API マリンバ音再生

src/lib/actions/
└── study-logs.ts         # Server Action（study_logs insert / daily_stats upsert）
```

### 各ファイルの責務

**`page.tsx`**
- 認証チェック → 未ログインなら `/login` にリダイレクト
- `<PomodoroTimer />` をレンダリング

**`useTimer.ts`**
- `setInterval` でカウントダウン
- `timeLeft === 0` でモード切り替えコールバック発火
- localStorage への読み書き
- 返り値: `{ state, start, stop, reset }`

**`useSound.ts`**
- Web Audio API で マリンバ風の音（正弦波 + エンベロープ）を生成・再生
- 返り値: `{ playChime }`

**`PomodoroTimer.tsx`**
- `useTimer` + `useSound` を組み合わせてUI描画
- SVG で円形プログレスリング（`stroke-dashoffset` で進捗表示）
- セッション完了時に `study-logs` Server Action を呼び出し

**`study-logs.ts`**
- `study_logs` に insert（duration_minutes, mode, started_at, ended_at）
- `daily_stats` に upsert（total_minutes を加算）

---

## DB 保存タイミング

- **作業セッション完了時のみ**保存（休憩完了時は保存しない）
- `started_at`: セッション開始時刻
- `ended_at`: セッション完了時刻
- `duration_minutes`: 25（固定）
- `mode`: `"work"`

---

## ナビゲーション

- `src/app/page.tsx`（ホーム）からタイマーページ `/timer` へのリンクを追加
