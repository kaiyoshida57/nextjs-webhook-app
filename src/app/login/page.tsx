import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, checkPassword, makeAuthToken } from '@/lib/auth';

async function login(formData: FormData) {
  'use server';
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) {
    redirect('/login?error=1');
  }
  const store = await cookies();
  store.set(AUTH_COOKIE, await makeAuthToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
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
        {error ? <p className="text-sm text-red-700">パスワードが違います</p> : null}
        <button type="submit" className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">
          入る
        </button>
      </form>
    </main>
  );
}
