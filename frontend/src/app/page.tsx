'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePostStore } from '@/src/store/postStore';
import { useAuthStore } from '@/src/store/authStore';
import Header from '@/src/components/Header';
import PostCard from '@/src/components/Postcards';
import LoadingSpinner from '@/src/components/LoadingSpinner';

export default function Home() {
  const { posts, isLoading, fetchPosts, searchPosts, pagination } = usePostStore();
  const { checkAuth } = useAuthStore();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
    fetchPosts();
  }, []);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category === '전체' ? '' : category);
    setSearchQuery('');
    fetchPosts(1, 12, category === '전체' ? '' : category);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchPosts(searchQuery);
      setSelectedCategory('');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pixel-home">
        {/* 배너 섹션 */}
        <section className="pixel-home-band">
          <div className="max-w-7xl mx-auto px-5 py-10 sm:px-8 sm:py-14">
            <div className="pixel-hero flex flex-col items-start gap-8 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <div className="pixel-room" aria-hidden="true"><span /><i /><b /></div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 mb-4">
                  우리집을 소개해주세요
                </h1>
                <p className="text-gray-600">
                  집 꾸미기 노하우, 홈스타일링 인테리어 커뮤니티
                </p>
              </div>
              <Link
                href="/posts/create"
                className="bg-violet-700 hover:bg-violet-800 text-white px-8 py-3 rounded-none font-medium transition"
              >
                글쓰기
              </Link>
            </div>
          </div>
        </section>

        {/* 검색 섹션 */}
        <section className="pixel-home-band">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="게시글을 검색해주세요"
                className="min-w-0 flex-1 px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-none font-medium transition"
              >
                검색
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    fetchPosts();
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-none font-medium transition"
                >
                  초기화
                </button>
              )}
            </form>
          </div>
        </section>

        {/* 카테고리 필터 */}
        <section className="pixel-category-bar sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {['전체', '거실', '침실', '주방', '욕실', '복도', '현관'].map(
                (category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={`px-4 py-2 rounded-none font-medium whitespace-nowrap transition ${
                      (category === '전체' && !selectedCategory) ||
                      selectedCategory === category
                        ? 'bg-violet-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* 게시글 목록 */}
        <section className="max-w-7xl mx-auto px-5 py-10 sm:px-8 sm:py-14">
          {isLoading ? (
            <LoadingSpinner />
          ) : posts.length === 0 ? (
            <div className="pixel-empty text-center py-16">
              <p className="text-gray-500 text-lg">게시글이 없습니다</p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchPosts();
                  }}
                  className="mt-4 text-violet-700 hover:text-violet-800"
                >
                  검색 초기화
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-9">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => fetchPosts(page)}
                        className={`px-4 py-2 rounded ${
                          pagination.page === page
                            ? 'bg-violet-700 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        } transition`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}