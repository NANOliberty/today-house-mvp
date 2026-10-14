'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/src/store/postStore';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`}>
      <div className="pixel-post-card bg-white overflow-hidden transition cursor-pointer h-full flex flex-col">
        {/* 이미지 */}
        {post.imageUrl ? (
          <div className="relative w-full aspect-[4/3] bg-gray-200">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority={false}
            />
          </div>
        ) : (
          <div className="pixel-no-image w-full aspect-[4/3] flex items-center justify-center">
            <span className="text-gray-400">이미지 없음</span>
          </div>
        )}

        {/* 내용 */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-2">
            <span className="text-xs bg-violet-100 text-violet-800 px-2 py-1 rounded">
              {post.category}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {post.content}
          </p>

          {/* 메타 정보 */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <span>{post.author.nickname}</span>
            <div className="flex gap-3">
              <span>❤️ {post._count.likes}</span>
              <span>💬 {post._count.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}