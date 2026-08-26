# 依頼板（Slack周知）

短い依頼をWebに残し、同じ内容をSlackへ送ります。チャットは周知、このアプリは履歴です。

v1は人がフォームに書きます。将来Figmaなどから自動で同じ通知に乗せることもできます。手動入力はそのまま残せます。

## セットアップ

```bash
cp .env.example .env
# DATABASE_URL を Neon の Postgres にする
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

ブラウザには保存しません。Postgres（Neonなど）に1件ずつ残します。

- 定義: [prisma/schema.prisma](prisma/schema.prisma) の `Request`（タイトル・本文・名前・Slack送信成否・日時）
- 接続: `.env` の `DATABASE_URL`
- 書き込み: フォーム送信 → [src/app/actions.ts](src/app/actions.ts) の `createRequest` → Prisma の `create`
- 読み込み: [src/app/page.tsx](src/app/page.tsx) の `findMany`
- 初回とschema変更時: `npx prisma db push`。普段の起動は `npm run dev` だけ

テーブルをGUIで見るときは `npx prisma studio` です。

`.env` の `SLACK_WEBHOOK_URL` は空のままでも投稿できます。チャットには届かず、画面に「Slack未送信」と出ます。

## 本番公開（人に見せる前）

**Postgres＋画面パスワード**で出します。

1. [Neon](https://console.neon.tech/) で無料プロジェクトを作り、接続文字列をコピーする
2. ローカルの `.env` の `DATABASE_URL` をその文字列にする
3. `npx prisma db push` で本番と同じDBにテーブルを作る
4. `APP_PASSWORD` を決めて `.env` に入れる（紹介用の共有パスワード）
5. GitHubにpushする（`.env` はコミットしない）
6. [Vercel](https://vercel.com/) にリポジトリを接続してデプロイする
7. Vercel の Environment Variables に次を入れる（Production）
   - `DATABASE_URL`
   - `APP_PASSWORD`
   - `SLACK_WEBHOOK_URL`
8. Redeploy する
9. 公開URLでログイン → 依頼を1件送り、Slackに届くか確認する

紹介相手にはURLと共有パスワードだけ渡す。Webhook URLは渡さない。

人に見せるSlackは、自分用ワークスペースではなく、相手が見られるチャンネルの Incoming Webhook に差し替える。

## Incoming Webhook

このアプリは**チャットから呼ばれる側ではなく、SlackへPOSTする側**です。

1. Slackのチャンネルで Incoming Webhook のURLを発行し、`SLACK_WEBHOOK_URL` に貼る
2. サーバーの環境変数だけ。Reactからは見えない

送るJSONは `{ "text": "..." }` です。処理の本体は [src/lib/notify.ts](src/lib/notify.ts) です。

## セキュリティ

- Webhook URLをGitにコミットしない
- 本番では `APP_PASSWORD` かVercel Deployment Protectionを使う
- 依頼の本文は社員向けの情報になり得る

## 使い方の例

- 自作画面のコメントを、Slackに「見てほしい」と流す
- PRの「このファイルだけ見て」をSlackに流す
- 本番前のOK確認をSlackに流す
