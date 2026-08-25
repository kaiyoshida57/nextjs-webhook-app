/**
 * Slack / Teams への周知（Outgoing Incoming Webhook）
 *
 * ポイント:
 * - これは「Figmaから届く受信Webhook」ではない。
 *   このアプリがチャット側のURLへHTTPS POSTする側である。
 * - Incoming Webhook URLは、SlackやTeamsのチャンネル設定で発行する。
 *   知っている人はそのチャンネルに投稿できるので、.envにだけ置き、ブラウザには出さない。
 * - どちらのサービスも、最低限は JSON の text をPOSTすればメッセージになる。
 * - URLが未設定なら投稿はDBに残し、チャット送信はスキップする（ローカル学習用）。
 */

export type NotifyResult = {
	slackNotified: boolean;
	teamsNotified: boolean;
};

function buildText(title: string, body: string, author: string): string {
	const who = author.trim() || "名前なし";
	const lines = [`【依頼】${title}`, `投稿者: ${who}`];
	const trimmed = body.trim();
	if (trimmed) {
		lines.push("", trimmed);
	}
	return lines.join("\n");
}

async function postIncomingWebhook(
	url: string,
	text: string,
	label: string,
): Promise<boolean> {
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ text }),
		});
		if (!response.ok) {
			const detail = await response.text();
			console.warn(`[notify] ${label} failed: ${response.status} ${detail}`);
			return false;
		}
		return true;
	} catch (error) {
		const message = error instanceof Error ? error.message : "unknown error";
		console.warn(`[notify] ${label} error: ${message}`);
		return false;
	}
}

export async function notifyChat(
	title: string,
	body: string,
	author: string,
): Promise<NotifyResult> {
	const text = buildText(title, body, author);
	const slackUrl = process.env.SLACK_WEBHOOK_URL?.trim();
	const teamsUrl = process.env.TEAMS_WEBHOOK_URL?.trim();

	const [slackNotified, teamsNotified] = await Promise.all([
		slackUrl
			? postIncomingWebhook(slackUrl, text, "Slack")
			: Promise.resolve(false),
		teamsUrl
			? postIncomingWebhook(teamsUrl, text, "Teams")
			: Promise.resolve(false),
	]);

	if (!slackUrl) {
		console.warn("[notify] SLACK_WEBHOOK_URL is not set; skip Slack");
	}
	if (!teamsUrl) {
		console.warn("[notify] TEAMS_WEBHOOK_URL is not set; skip Teams");
	}

	return { slackNotified, teamsNotified };
}
