'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/src/store/authStore';
import Header from '@/src/components/Header';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pixel-auth min-h-[calc(100svh-4rem)] flex items-center justify-center py-12 px-5 sm:py-16">
        <div className="pixel-panel pixel-auth-panel bg-white p-6 sm:p-10 w-full max-w-md">
          <h1 className="pixel-window-title text-3xl font-black mb-8 text-gray-900">
            로그인
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700"
                placeholder="비밀번호"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-700 hover:bg-violet-800 text-white font-medium py-2 rounded-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-dashed border-[#d8cce9] text-center text-sm">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link href="/register" className="text-violet-700 hover:text-violet-800 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}