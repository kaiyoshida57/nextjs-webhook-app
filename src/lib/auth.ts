export const AUTH_COOKIE = "request_board_auth";

export function isAuthEnabled(): boolean {
	return Boolean(process.env.APP_PASSWORD?.trim());
}

function toHex(bytes: ArrayBuffer): string {
	return Array.from(new Uint8Array(bytes))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function makeAuthToken(): Promise<string> {
	const secret = process.env.APP_PASSWORD?.trim() || "";
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode("ok"),
	);
	return toHex(sig);
}

export async function isValidAuthToken(
	token: string | undefined,
): Promise<boolean> {
	if (!isAuthEnabled()) {
		return true;
	}
	if (!token) {
		return false;
	}
	const expected = await makeAuthToken();
	if (token.length !== expected.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < token.length; i++) {
		diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}

export function checkPassword(input: string): boolean {
	const expected = process.env.APP_PASSWORD?.trim() || "";
	if (!expected) {
		return true;
	}
	if (input.length !== expected.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < input.length; i++) {
		diff |= input.charCodeAt(i) ^ expected.charCodeAt(i);
	}
	return diff === 0;
}
