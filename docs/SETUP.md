# SubsManager セットアップ手順

## 概要

SubsManagerは、サブスクリプション管理を行うWebアプリケーションです。
この手順書では、ローカル環境でアプリケーションを動作させるための手順を説明します。

## 前提条件

以下のソフトウェアがインストールされている必要があります：

- Node.js 18.x 以上
- npm 9.x 以上
- Docker および Docker Compose（データベース用）
- Git

## 1. リポジトリのクローンと移動

```bash
cd subscription_management_app
```

## 2. データベースとRedisの起動

Docker Composeを使用して、PostgreSQLとRedisを起動します：

```bash
# データベースとRedisを起動
docker-compose up -d

# 起動確認
docker-compose ps
```

データベースの接続情報：
- Host: localhost
- Port: 5432
- Database: subsmanager_db
- Username: subsmanager
- Password: password

Redis情報：
- Host: localhost
- Port: 6379

## 3. バックエンドのセットアップ

### 依存関係のインストール

```bash
cd backend
npm install
```

### 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp .env.example .env

# 必要に応じて.envファイルを編集（デフォルト設定で動作します）
```

環境変数の主要な設定：
- `DATABASE_URL`: PostgreSQL接続URL
- `REDIS_URL`: Redis接続URL
- `JWT_SECRET`: JWT署名用シークレット
- `JWT_REFRESH_SECRET`: リフレッシュトークン署名用シークレット

### データベースマイグレーション

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーションの実行
npx prisma db push

# （オプション）Prisma Studioでデータベース確認
npx prisma studio
```

### バックエンドサーバーの起動

```bash
# 開発モードで起動
npm run dev
```

バックエンドサーバーは http://localhost:3001 で起動します。

### API動作確認

```bash
# ヘルスチェック
curl http://localhost:3001/health
```

## 4. フロントエンドのセットアップ

新しいターミナルウィンドウで：

### 依存関係のインストール

```bash
cd frontend
npm install
```

### 環境変数の設定

```bash
# 環境変数ファイルをコピー
cp .env.example .env

# 必要に応じて.envファイルを編集（デフォルト設定で動作します）
```

### フロントエンドサーバーの起動

```bash
# 開発モードで起動
npm run dev
```

フロントエンドアプリケーションは http://localhost:3000 で起動します。

## 5. 動作確認

1. ブラウザで http://localhost:3000 にアクセス
2. 「新規登録」をクリックしてアカウントを作成
3. 作成したアカウントでログイン
4. ダッシュボードが表示されることを確認

## 6. 開発時のコマンド

### バックエンド（backend/）

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番環境起動
npm start

# リント
npm run lint

# フォーマット
npm run format

# テスト
npm test
```

### フロントエンド（frontend/）

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# リント
npm run lint

# フォーマット
npm run format

# 型チェック
npm run type-check
```

## 7. トラブルシューティング

### データベース接続エラー

```bash
# Dockerコンテナの状態確認
docker-compose ps

# コンテナの再起動
docker-compose restart postgres

# ログ確認
docker-compose logs postgres
```

### ポート衝突エラー

別のアプリケーションがポートを使用している場合：

```bash
# ポート使用状況確認
lsof -i :3000  # フロントエンド
lsof -i :3001  # バックエンド
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### 依存関係のエラー

```bash
# node_modulesとpackage-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### Prismaエラー

```bash
# Prismaクライアント再生成
npx prisma generate

# データベーススキーマリセット
npx prisma db push --force-reset
```

## 8. Git ブランチ運用

現在のブランチ: `feature/auth-login`

```bash
# 現在のブランチ確認
git branch

# 変更をコミット
git add .
git commit -m "認証機能の実装完了"

# developブランチへのマージ（将来）
git checkout develop
git merge feature/auth-login
```

## 技術仕様

### バックエンド
- Node.js 18+ / TypeScript
- Express.js (REST API)
- PostgreSQL 14 (Prisma ORM)
- Redis (セッション管理)
- JWT + Refresh Token認証
- Zod（バリデーション）

### フロントエンド
- React 18 / TypeScript
- Vite（ビルドツール）
- Tailwind CSS（スタイリング）
- Zustand（状態管理）
- React Hook Form + Zod（フォーム管理）
- React Router（ルーティング）

### インフラ
- Docker Compose（ローカル開発環境）
- すべてローカル環境で動作