# 依頼ボード（Slack / Teams周知）

短い依頼をWebに残し、同じ内容をSlackとTeamsへ送ります。チャットは周知、このアプリは履歴です。

v1は人がフォームに書きます。将来Figmaなどから自動で同じ通知に乗せることもできます。手動入力はそのまま残せます。

## セットアップ

```bash
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

http://localhost:3000

## 画面

| パス | 内容 |
|------|------|
| `/` | 依頼の投稿フォームと、新しい順の一覧（最大50件） |
| `/login` | 共有パスワードの入力。`APP_PASSWORD` が空なら通常は使わない |

`APP_PASSWORD` を `.env` に入れると、未ログインは `/login` へ飛ばされます（[src/middleware.ts](src/middleware.ts)）。個人アカウントではなく、チームで同じパスワードを使う簡易ロックです。空なら `/` に直接入れます。

## データ保存

ブラウザには保存しません。サーバーのSQLiteファイルに1件ずつ残します。

- 定義: [prisma/schema.prisma](prisma/schema.prisma) の `Request`（タイトル・本文・名前・Slack/Teams送信成否・日時）
- ファイル: `prisma/dev.db`（`DATABASE_URL=file:./dev.db`。schemaからの相対パス）
- 書き込み: フォーム送信 → [src/app/actions.ts](src/app/actions.ts) の `createRequest` → Prisma の `create`
- 読み込み: [src/app/page.tsx](src/app/page.tsx) の `findMany`
- 初回とschema変更時: `npx prisma db push`。普段の起動は `npm run dev` だけ

テーブルをGUIで見るときは `npx prisma studio` です。Vercelではこのファイルは残らないので、本番はNeonなどのPostgresに切り替えます。

`.env` の `SLACK_WEBHOOK_URL` / `TEAMS_WEBHOOK_URL` は空のままでも投稿できます。チャットには届かず、画面に「チャット未送信」と出ます。

## Incoming Webhook

このアプリは**チャットから呼ばれる側ではなく、チャットへPOSTする側**です。

1. Slack: チャンネルの Incoming Webhook でURLを発行し、`SLACK_WEBHOOK_URL` に貼る
2. Teams: Incoming Webhook（またはWorkflowsのWebhook URL）を `TEAMS_WEBHOOK_URL` に貼る
3. どちらもサーバーの環境変数だけ。Reactからは見えない

処理の本体は [src/lib/notify.ts](src/lib/notify.ts) です。

## セキュリティ

- Webhook URLをGitにコミットしない
- 本番では `APP_PASSWORD` かVercel Deployment Protectionを使う
- 依頼の本文は社員向けの情報になり得る

## 使い方の例

- 自作画面のコメントを、Slack／Teamsに「見てほしい」と流す
- PRの「このファイルだけ見て」をSlack／Teamsに流す
- 本番前のOK確認をSlack／Teamsに流す
