# SubsManager - サブスクリプション管理アプリ

## 概要

SubsManagerは、個人のサブスクリプションサービスを一元管理するWebアプリケーションです。
月額・年額課金サービスの支出を効率的に追跡し、管理することができます。

## 特徴

- **ユーザー管理**: JWT + Refresh Token による安全な認証システム
- **サブスクリプション管理**: 登録・編集・削除・カテゴリ分類
- **支払い追跡**: 月次・年次支出の可視化と履歴管理
- **通知機能**: 更新日のリマインダー
- **ダッシュボード**: 統計グラフとサマリー表示

## 技術仕様

### フロントエンド
- React 18 + TypeScript
- Vite（ビルドツール）
- Tailwind CSS（スタイリング）
- Zustand（状態管理）
- React Hook Form + Zod（フォーム管理）
- Headless UI（UIコンポーネント）

### バックエンド
- Node.js + TypeScript
- Express.js（REST API）
- JWT + Refresh Token認証
- Zod（バリデーション）
- Node-cron + Nodemailer（通知）

### データベース・インフラ
- PostgreSQL 14 + Prisma ORM
- Redis（キャッシュ・セッション管理）
- Docker Compose（ローカル開発環境）

## クイックスタート

詳細なセットアップ手順は [docs/SETUP.md](./docs/SETUP.md) をご覧ください。

```bash
# 1. データベースとRedisを起動
docker-compose up -d

# 2. バックエンドセットアップ
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev

# 3. フロントエンドセットアップ（新しいターミナルで）
cd frontend
npm install
cp .env.example .env
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 開発状況

### 実装済み機能（v1.0 - feature/auth-login）
- ✅ プロジェクト基盤構築
- ✅ ユーザー認証（登録・ログイン・ログアウト）
- ✅ JWT + Refresh Token認証システム
- ✅ 基本的なダッシュボード

### 今後の実装予定
- 🔄 サブスクリプション管理機能
- 🔄 支払い履歴・統計機能
- 🔄 通知・リマインダー機能
- 🔄 設定管理機能

## Git ブランチ戦略

- `main`: 安定版
- `develop`: 開発統合用
- `feature/[機能名]`: 機能ごとの実装用

現在のブランチ: `feature/auth-login`

## ライセンス

MIT License
