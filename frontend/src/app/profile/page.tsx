'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/src/store/authStore';
import Header from '@/src/components/Header';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">프로필</h1>

            <div className="space-y-6">
              {/* 사용자 정보 */}
              <div className="pb-6 border-b">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold text-center text-gray-900">
                    {user.nickname}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      이메일
                    </label>
                    <p className="text-gray-600">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      가입일
                    </label>
                    <p className="text-gray-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('ko-KR')
                        : '정보 없음'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 내 게시글 */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  내 게시글
                </h3>
                <p className="text-gray-600 mb-4">
                  내가 작성한 게시글을 관리할 수 있습니다.
                </p>
                <Link
                  href="/?author=me"
                  className="inline-block px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
                >
                  내 게시글 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}