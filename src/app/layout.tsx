import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '依頼板',
  description: '短い依頼を一覧に残し、Slackへ周知する',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja">
      <body className="min-h-full bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
