export const AUTH_COOKIE = 'request_board_auth';
export const AUTH_MAX_AGE_SEC = 60 * 60 * 24 * 14;

export function isAuthEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD?.trim());
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(message: string): Promise<string> {
  const secret = process.env.APP_PASSWORD?.trim() || '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(sig);
}

export async function makeAuthToken(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SEC;
  const expStr = String(exp);
  return `${expStr}.${await hmacHex(expStr)}`;
}

export async function isValidAuthToken(token: string | undefined): Promise<boolean> {
  if (!isAuthEnabled()) {
    return true;
  }
  if (!token) {
    return false;
  }
  const dot = token.indexOf('.');
  if (dot <= 0 || dot !== token.lastIndexOf('.')) {
    return false;
  }
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9]+$/.test(expStr) || !/^[0-9a-f]+$/.test(sig)) {
    return false;
  }
  const exp = Number(expStr);
  if (!Number.isSafeInteger(exp) || Math.floor(Date.now() / 1000) >= exp) {
    return false;
  }
  const expected = await hmacHex(expStr);
  return timingSafeEqual(sig, expected);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD?.trim() || '';
  if (!expected) {
    return true;
  }
  return timingSafeEqual(input, expected);
}
