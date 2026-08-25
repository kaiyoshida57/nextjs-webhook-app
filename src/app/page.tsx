import { RequestForm } from "@/app/RequestForm";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { prisma } from "@/lib/prisma";

type RequestItem = {
	id: string;
	title: string;
	body: string;
	author: string;
	slackNotified: boolean;
	teamsNotified: boolean;
	createdAt: Date;
};

export const dynamic = "force-dynamic";

function notifyLabel(slack: boolean, teams: boolean): string {
	const parts: string[] = [];
	if (slack) parts.push("Slack");
	if (teams) parts.push("Teams");
	if (parts.length === 0) {
		return "チャット未送信（Webhook URL未設定または失敗）";
	}
	return `${parts.join(" / ")}に通知済み`;
}

export default async function Home() {
	const requests: RequestItem[] = await prisma.request.findMany({
		orderBy: { createdAt: "desc" },
		take: 50,
	});

	return (
		<main className="mx-auto max-w-xl px-4 py-10">
			<header className="mb-8">
				<h1 className="text-xl font-semibold tracking-tight">依頼</h1>
				<p className="mt-1 text-sm text-zinc-600">
					短い依頼を残すと、この一覧とSlack／Teamsに同じ内容が届きます。
				</p>
			</header>

			<RequestForm />

			<ul className="mt-8 space-y-3">
				{requests.length === 0 && (
					<li className="text-sm text-zinc-500">まだ依頼はありません</li>
				)}
				{requests.map((item) => (
					<li
						key={item.id}
						className="rounded-lg border border-zinc-200 bg-white p-4"
					>
						<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
							<h2 className="text-sm font-medium">{item.title}</h2>
							<span className="text-xs text-zinc-500">
								{item.author || "名前なし"}
							</span>
							<span className="text-xs text-zinc-500">
								{formatRelativeTime(item.createdAt)}
							</span>
						</div>
						{item.body ? (
							<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
								{item.body}
							</p>
						) : null}
						<p className="mt-2 text-xs text-zinc-500">
							{notifyLabel(item.slackNotified, item.teamsNotified)}
						</p>
					</li>
				))}
			</ul>
		</main>
	);
}
