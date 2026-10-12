'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/src/store/authStore';
import { usePostStore } from '@/src/store/postStore';
import Header from '@/src/components/Header';
import apiClient from '@/src/lib/apiClient';

const CATEGORIES = ['거실', '침실', '주방', '욕실', '복도', '현관', '기타'];

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createPost } = usePostStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('거실');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 로그인 체크
  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              로그인하기
            </button>
          </div>
        </div>
      </>
    );
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageUrl(response.data.url);
      return response.data.url;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || '이미지 업로드 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      let finalImageUrl = imageUrl;

      // 이미지가 선택되었지만 아직 업로드되지 않았을 경우
      if (image && !imageUrl) {
        finalImageUrl = await uploadImage();
      }

      await createPost(title, content, category, finalImageUrl || undefined);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '게시글 작성 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">새 글 작성</h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 카테고리 */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  이미지 (선택)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto mb-4 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null);
                          setImagePreview('');
                          setImageUrl('');
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        이미지 제거
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-input"
                      />
                      <label
                        htmlFor="image-input"
                        className="cursor-pointer text-blue-500 hover:text-blue-600 font-medium"
                      >
                        이미지를 선택해주세요
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        또는 드래그하여 업로드
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="내용을 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={12}
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {isLoading ? '작성 중...' : '글 작성'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}