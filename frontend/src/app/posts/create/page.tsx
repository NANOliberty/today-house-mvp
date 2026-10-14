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
          <div className="pixel-panel bg-white p-8 text-center">
            <p className="text-gray-600 mb-4">로그인이 필요합니다</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-none"
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
      <main className="min-h-screen pixel-editor">
        <div className="max-w-4xl mx-auto px-5 py-8 sm:px-8 sm:py-14">
          <div className="pixel-panel pixel-editor-panel bg-white p-5 sm:p-10">
            <h1 className="pixel-window-title text-3xl font-black text-gray-900 mb-8">새 글 작성</h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 카테고리 */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  이미지 (선택)
                </label>
                <div className="pixel-upload border-2 border-dashed border-gray-300 p-6 sm:p-10">
                  {imagePreview ? (
                    <div className="text-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-96 mx-auto mb-5 border-2 border-[#29243d]"
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
                        className="sr-only peer"
                        id="image-input"
                      />
                      <label
                        htmlFor="image-input"
                        className="pixel-upload-label cursor-pointer text-violet-700 hover:text-violet-800 font-bold peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-4"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700 resize-none"
                  rows={12}
                />
              </div>

              {/* 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t-2 border-[#29243d]">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-violet-700 hover:bg-violet-800 text-white rounded-none font-medium transition disabled:opacity-50"
                >
                  {isLoading ? '작성 중...' : '글 작성'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-none font-medium transition"
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