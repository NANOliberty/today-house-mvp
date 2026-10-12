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
      <div className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer h-full flex flex-col">
        {/* 이미지 */}
        {post.imageUrl ? (
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              priority={false}
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-gray-400">이미지 없음</span>
          </div>
        )}

        {/* 내용 */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-2">
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              {post.category}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
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