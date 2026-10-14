'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePostStore, Post } from '@/src/store/postStore';
import { useAuthStore } from '@/src/store/authStore';
import Header from '@/src/components/Header';
import LoadingSpinner from '@/src/components/LoadingSpinner';
import apiClient from '@/src/lib/apiClient';

interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    nickname: string;
  };
  createdAt: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = parseInt(params.id as string);
  
  const { currentPost, fetchPostById } = usePostStore();
  const { user } = useAuthStore();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [error, setError] = useState('');

  // dev(StrictMode)에서 effect 가 두 번 실행돼 조회수가 +2 되는 것을 막는다
  const loadedForId = useRef<number | null>(null);
  useEffect(() => {
    if (loadedForId.current === postId) return;
    loadedForId.current = postId;
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setIsLoading(true);
      await fetchPostById(postId);
      // 서버 응답을 지역 상태에 동기화 (좋아요 여부/개수, 댓글 목록)
      const loaded = usePostStore.getState().currentPost as (Post & { isLiked?: boolean; comments?: Comment[] }) | null;
      if (loaded) {
        setIsLiked(!!loaded.isLiked);
        setLikeCount(loaded._count?.likes ?? 0);
        setComments(loaded.comments ?? []);
      }
    } catch (err) {
      setError('게시글을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    try {
      const { data } = await apiClient.post<{ liked: boolean }>(`/posts/${postId}/like`);
      setIsLiked(data.liked);
      setLikeCount(prev => (data.liked ? prev + 1 : prev - 1));
    } catch (err) {
      setError('좋아요 처리 실패');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    if (!newComment.trim()) {
      alert('댓글을 입력해주세요');
      return;
    }

    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || '댓글 작성 실패');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err: any) {
      setError(err.response?.data?.message || '댓글 삭제 실패');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await apiClient.delete(`/posts/${postId}`);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '게시글 삭제 실패');
    }
  };

  if (isLoading) return <><Header /><LoadingSpinner /></>;
  if (error) return <><Header /><div className="text-center py-12 text-red-500">{error}</div></>;
  if (!currentPost) return <><Header /><div className="text-center py-12">게시글을 찾을 수 없습니다</div></>;

  const post = currentPost as Post & { isLiked?: boolean };

  return (
    <>
      <Header />
      <main className="min-h-screen pixel-detail">
        <div className="max-w-5xl mx-auto px-5 py-8 sm:px-8 sm:py-14">
          {/* 게시글 헤더 */}
          <div className="pixel-panel bg-white p-5 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-5 mb-6">
              <div>
                <span className="text-sm bg-violet-100 text-violet-800 px-3 py-1 rounded">
                  {post.category}
                </span>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight break-words text-gray-900 mt-5 mb-3">
                  {post.title}
                </h1>
              </div>
              {user?.id === post.author.id && (
                <div className="flex gap-2">
                  <Link
                    href={`/posts/${postId}/edit`}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition"
                  >
                    수정
                  </Link>
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 작성자 정보 */}
            <div className="flex items-center justify-between py-4 border-t border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="pixel-avatar w-10 h-10 shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-900">{post.author.nickname}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>조회 {post.viewCount}</span>
              </div>
            </div>
          </div>

          {/* 게시글 이미지 */}
          {post.imageUrl && (
            <div className="pixel-panel bg-white overflow-hidden mb-8">
              <div className="relative w-full h-[55vh] min-h-[280px] sm:h-[70vh] sm:max-h-[800px]">
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          )}

          {/* 게시글 내용 */}
          <div className="pixel-panel bg-white p-6 sm:p-10 mb-8">
            <div className="max-w-3xl mx-auto text-base sm:text-lg break-words">
              {post.content.split('\n').map((line, i) => (
                <p key={i} className="mb-4 text-gray-700 leading-relaxed">
                  {line || <br />}
                </p>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="pixel-panel bg-white p-5 sm:p-8 mb-6 flex flex-wrap gap-3">
            <button
              onClick={handleLike}
              className={`px-6 py-3 rounded-none font-medium transition ${
                isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ❤️ 좋아요 {likeCount}
            </button>
            <div className="px-6 py-3 bg-gray-100 text-gray-700 rounded-none font-medium">
              💬 댓글 {comments.length}
            </div>
          </div>

          {/* 댓글 작성 */}
          {user && (
            <div className="pixel-panel bg-white p-5 sm:p-8 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">댓글 남기기</h3>
              <form onSubmit={handleCommentSubmit} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력해주세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-violet-700 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-none font-medium transition"
                >
                  댓글 작성
                </button>
              </form>
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="pixel-panel bg-white p-5 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              댓글 {comments.length}
            </h3>

            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                댓글이 없습니다. 첫 댓글을 남겨보세요!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="pb-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.author.nickname}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {user?.id === comment.author.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 break-words">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}