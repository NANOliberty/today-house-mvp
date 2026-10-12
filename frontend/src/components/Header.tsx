'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="text-2xl font-bold text-blue-500">
          오늘의집
        </Link>

        {/* 검색 */}
        <div className="hidden md:flex flex-1 mx-8">
          <input
            type="text"
            placeholder="검색"
            className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 네비게이션 */}
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/posts/create"
                className="text-gray-700 hover:text-blue-500 font-medium transition"
              >
                글쓰기
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-blue-500 font-medium transition"
                >
                  {user.nickname}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg transition"
                    >
                      프로필
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg transition"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-700 hover:text-blue-500 font-medium transition"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition"
              >
                가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}