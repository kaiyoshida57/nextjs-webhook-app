'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { notifyChat } from '@/lib/notify';
import { prisma } from '@/lib/prisma';
import { AUTHOR_MAX, BODY_MAX, TITLE_MAX } from '@/lib/requestFields';
import { clientIp, consume, POST_LIMIT } from '@/lib/rateLimit';
import { requireAuth } from '@/lib/requireAuth';

export type CreateRequestState = {
  error?: string;
};

export async function createRequest(_prev: CreateRequestState, formData: FormData): Promise<CreateRequestState> {
  await requireAuth();

  const ip = await clientIp();
  if (!consume(`post:${ip}`, POST_LIMIT)) {
    return { error: '投稿が多すぎます。時間をおいてください' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const author = String(formData.get('author') ?? '').trim();

  if (!title) {
    return { error: 'タイトルを入力してください' };
  }
  if (title.length > TITLE_MAX) {
    return { error: `タイトルは${TITLE_MAX}文字以内にしてください` };
  }
  if (body.length > BODY_MAX) {
    return { error: `本文は${BODY_MAX}文字以内にしてください` };
  }
  if (author.length > AUTHOR_MAX) {
    return { error: `名前は${AUTHOR_MAX}文字以内にしてください` };
  }

  let created;
  try {
    created = await prisma.request.create({
      data: {
        title,
        body,
        author,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.warn(`[createRequest] DB create failed: ${message}`);
    return { error: '保存に失敗しました。時間をおいて再度お試しください' };
  }

  const notified = await notifyChat(title, body, author);
  if (notified.slackNotified) {
    await prisma.request.update({
      where: { id: created.id },
      data: { slackNotified: true },
    });
  }

  revalidatePath('/');
  redirect('/');
}
