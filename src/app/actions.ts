"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyChat } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

export type CreateRequestState = {
	error?: string;
};

export async function createRequest(
	_prev: CreateRequestState,
	formData: FormData,
): Promise<CreateRequestState> {
	const title = String(formData.get("title") ?? "").trim();
	const body = String(formData.get("body") ?? "").trim();
	const author = String(formData.get("author") ?? "").trim();

	if (!title) {
		return { error: "タイトルを入力してください" };
	}

	// 先にチャットへPOSTし、成否をDBに残す（URL未設定なら false のまま保存）
	const notified = await notifyChat(title, body, author);

	await prisma.request.create({
		data: {
			title,
			body,
			author,
			slackNotified: notified.slackNotified,
			teamsNotified: notified.teamsNotified,
		},
	});

	revalidatePath("/");
	redirect("/");
}
