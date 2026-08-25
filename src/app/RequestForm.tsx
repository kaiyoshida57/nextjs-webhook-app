"use client";

import { useActionState } from "react";
import { createRequest, type CreateRequestState } from "@/app/actions";

const initial: CreateRequestState = {};

export function RequestForm() {
	const [state, formAction, pending] = useActionState(createRequest, initial);

	return (
		<form action={formAction} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
			<label className="block">
				<span className="text-sm font-medium text-zinc-800">タイトル</span>
				<input
					name="title"
					required
					maxLength={120}
					placeholder="例: PR 42のapp.tsを見てほしい"
					className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
				/>
			</label>
			<label className="block">
				<span className="text-sm font-medium text-zinc-800">本文（任意・URL可）</span>
				<textarea
					name="body"
					rows={4}
					maxLength={2000}
					placeholder="見てほしい箇所やリンク"
					className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
				/>
			</label>
			<label className="block">
				<span className="text-sm font-medium text-zinc-800">名前（任意）</span>
				<input
					name="author"
					maxLength={40}
					placeholder="例: 山田"
					className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
				/>
			</label>
			{state.error && (
				<p className="text-sm text-red-700">{state.error}</p>
			)}
			<button
				type="submit"
				disabled={pending}
				className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
			>
				{pending ? "送信中..." : "送る"}
			</button>
		</form>
	);
}
