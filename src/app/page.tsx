import { RequestForm } from '@/app/RequestForm';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function notifyLabel(slack: boolean): string {
  if (slack) {
    return 'Slackに通知済み';
  }
  return 'Slack未送信（Webhook URL未設定または失敗）';
}

export default async function Home() {
  const requests = await prisma.request.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">依頼板</h1>
        <p className="mt-1 text-sm text-zinc-600">短い依頼を残すと、この一覧とSlackに同じ内容が届きます。</p>
      </header>

      <RequestForm />

      <ul className="mt-8 space-y-3">
        {requests.length === 0 && <li className="text-sm text-zinc-500">まだ依頼はありません</li>}
        {requests.map((item) => (
          <li key={item.id} className="wrap-anywhere rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="min-w-0 max-w-full text-sm font-medium">{item.title}</h2>
              <span className="text-xs text-zinc-500">{item.author || '名前なし'}</span>
              <span className="text-xs text-zinc-500">{formatRelativeTime(item.createdAt)}</span>
            </div>
            {item.body ? (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-500">{notifyLabel(item.slackNotified)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
