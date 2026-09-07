import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE, isValidAuthToken } from '@/lib/auth';

export async function requireAuth(): Promise<void> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!(await isValidAuthToken(token))) {
    redirect('/login');
  }
}
