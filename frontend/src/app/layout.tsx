import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '오늘의집 - 집 꾸미기 노하우, 홈스타일링 인테리어 커뮤니티',
  description: '오늘의집에서 우리집을 꾸미기 위한 영감을 얻으세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}