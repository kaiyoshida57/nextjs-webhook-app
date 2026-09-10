import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, AUTH_MAX_AGE_SEC, checkPassword, makeAuthToken } from '@/lib/auth';
import { clientIp, hit, isLimited, LOGIN_FAIL_LIMIT } from '@/lib/rateLimit';

async function login(formData: FormData) {
  'use server';
  const ip = await clientIp();
  const loginKey = `login:${ip}`;
  if (isLimited(loginKey, LOGIN_FAIL_LIMIT)) {
    redirect('/login?error=rate');
  }

  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) {
    hit(loginKey);
    redirect(isLimited(loginKey, LOGIN_FAIL_LIMIT) ? '/login?error=rate' : '/login?error=1');
  }
  const store = await cookies();
  store.set(AUTH_COOKIE, await makeAuthToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE_SEC,
  });
  redirect('/');
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">ログイン</h1>
      <p className="mt-2 text-sm text-zinc-600">共有パスワードを入力してください。</p>
      <form action={login} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
        />
        {error === 'rate' ? (
          <p className="text-sm text-red-700">試行が多すぎます。時間をおいてください</p>
        ) : error ? (
          <p className="text-sm text-red-700">パスワードが違います</p>
        ) : null}
        <button type="submit" className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
          入る
        </button>
      </form>
    </main>
  );
}
