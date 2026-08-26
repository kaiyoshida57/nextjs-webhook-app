/**
 * Slack への周知（アプリからチャットへ送る側のWebhook）
 *
 * ポイント:
 * - これは「Figmaなどから届く受信Webhook」ではない。
 *   このアプリが Slack の Incoming Webhook URL へ HTTPS POST する側である。
 * - URLはチャンネル設定で発行する。知っている人はそのチャンネルに投稿できるので、
 *   .env にだけ置き、ブラウザには出さない。
 * - Slack は JSON の { "text": "..." } を POST すればメッセージになる。
 * - URLが未設定なら投稿はDBに残し、チャット送信はスキップする。
 */

export type NotifyResult = {
  slackNotified: boolean;
};

function buildText(title: string, body: string, author: string): string {
  const who = author.trim() || '名前なし';
  const lines = [`【依頼板】${title}`, `投稿者: ${who}`];
  const trimmed = body.trim();
  if (trimmed) {
    lines.push('', trimmed);
  }
  return lines.join('\n');
}

async function postSlackWebhook(url: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.warn(`[notify] Slack failed: ${response.status} ${detail}`);
      return false;
    }
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.warn(`[notify] Slack error: ${message}`);
    return false;
  }
}

export async function notifyChat(title: string, body: string, author: string): Promise<NotifyResult> {
  const slackUrl = process.env.SLACK_WEBHOOK_URL?.trim();

  if (!slackUrl) {
    console.warn('[notify] SLACK_WEBHOOK_URL is not set; skip Slack');
    return { slackNotified: false };
  }

  const slackNotified = await postSlackWebhook(slackUrl, buildText(title, body, author));
  return { slackNotified };
}
