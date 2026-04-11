## プロジェクト概要

Stupomo（スタポモ）は、ポモドーロ・テクニックを活用した学習時間記録Webアプリです。
タイマーを動かすだけで学習時間が自動記録され、日別・週別の学習時間を確認できます。

- **ローカル**: http://localhost:3001
- **本番**: https://stupomo.vercel.app

---

## 技術スタック

- **フロントエンド**: Next.js 16 / TypeScript
- **UI**: Tailwind CSS
- **認証・DB**: Supabase（Auth / PostgreSQL）
- **インフラ**: Vercel
- **開発環境**: Docker / Supabase CLI

---

## ディレクトリ構成

```
Stupomo/
├── src/
│   ├── app/              # App Router（ページ・レイアウト）
│   └── lib/
│       └── supabase/
│           ├── client.ts # クライアントコンポーネント用Supabaseクライアント
│           └── server.ts # サーバーコンポーネント用Supabaseクライアント
├── supabase/
│   └── config.toml       # Supabase CLIの設定
├── public/               # 静的ファイル
├── Dockerfile            # 開発用Dockerイメージ
├── docker-compose.yml    # Docker Compose設定
└── .env.local            # 環境変数（gitignore済み）
```

---

## 環境変数

`.env.local` に以下を設定：

```
NEXT_PUBLIC_SUPABASE_URL=     # SupabaseプロジェクトのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabaseの公開キー（Publishable key）
```

---

## よく使うコマンド

```bash
# Supabaseローカル起動（DockerDesktop起動後に実行）
supabase start

# Supabaseローカル停止
supabase stop

# Next.js開発サーバー起動（Docker）
docker compose up

# Docker停止
docker compose down

# マイグレーション作成
supabase migration new <migration_name>

# マイグレーション適用（ローカル）
supabase db reset

# 本番DBへのマイグレーション適用
supabase db push
```

---

## 開発ルール

- **コミットメッセージは日本語**
- **ブランチ戦略**: 機能ごとにブランチを切る（例: `feature/auth`, `feature/timer`）
- **PRテンプレート**: 概要・実装内容・動作確認の3つを日本語で記載
- mainブランチへの直接pushは禁止

---

## ロードマップ（MVPリリースまで）

### フェーズ1：認証機能
- [ ] middleware作成（セッション管理）
- [ ] Googleログイン実装
- [ ] ログアウト実装
- [ ] ログインページ作成
- [ ] 認証状態に応じたリダイレクト

### フェーズ2：DBセットアップ
- [ ] マイグレーションファイル作成（profiles / study_logs / daily_stats）
- [ ] RLS（Row Level Security）設定
- [ ] ローカルDBへの適用・動作確認

### フェーズ3：ポモドーロタイマー機能
- [ ] タイマーUI作成（25分 / 5分）
- [ ] タイマー開始 / 停止 / リセット
- [ ] localStorageでタイマー状態を保持
- [ ] セッション終了時に学習記録をDBへ保存

### フェーズ4：学習記録機能
- [ ] 今日の学習時間合計を表示
- [ ] 学習履歴一覧ページ作成
- [ ] daily_statsの集計・表示

### フェーズ5：BGM機能
- [ ] MP3再生
- [ ] 音量調整
- [ ] ループ再生

### フェーズ6：MVPリリース
- [ ] Vercel本番デプロイ確認
- [ ] Supabase本番DBへのマイグレーション適用
- [ ] 動作確認・バグ修正
