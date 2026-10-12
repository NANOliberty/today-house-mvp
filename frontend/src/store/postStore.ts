import { create } from 'zustand';
import apiClient from '@/src/lib/apiClient';

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  category: string;
  viewCount: number;
  author: {
    id: number;
    nickname: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

interface PostStore {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  fetchPosts: (page?: number, limit?: number, category?: string, search?: string) => Promise<void>;
  searchPosts: (query: string, page?: number) => Promise<void>;
  fetchPostById: (id: number) => Promise<void>;
  createPost: (title: string, content: string, category: string, imageUrl?: string) => Promise<void>;
  updatePost: (id: number, title: string, content: string, category: string, imageUrl?: string) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  toggleLike: (postId: number) => Promise<void>;
}

export const usePostStore = create<PostStore>((set) => ({
  posts: [],
  currentPost: null,
  isLoading: false,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  },

  fetchPosts: async (page = 1, limit = 12, category = '', search = '') => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const response = await apiClient.get(`/posts?${params}`);
      const { posts, pagination } = response.data;

      set({
        posts,
        pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  searchPosts: async (query: string, page = 1) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/posts/search?q=${encodeURIComponent(query)}&page=${page}`);
      const { posts, pagination } = response.data;

      set({
        posts,
        pagination,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchPostById: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/posts/${id}`);
      set({
        currentPost: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createPost: async (title: string, content: string, category: string, imageUrl?: string) => {
    try {
      await apiClient.post('/posts', {
        title,
        content,
        category,
        imageUrl,
      });
    } catch (error) {
      throw error;
    }
  },

  updatePost: async (id: number, title: string, content: string, category: string, imageUrl?: string) => {
    try {
      await apiClient.put(`/posts/${id}`, {
        title,
        content,
        category,
        imageUrl,
      });
    } catch (error) {
      throw error;
    }
  },

  deletePost: async (id: number) => {
    try {
      await apiClient.delete(`/posts/${id}`);
    } catch (error) {
      throw error;
    }
  },

  toggleLike: async (postId: number) => {
    try {
      await apiClient.post(`/posts/${postId}/like`);
    } catch (error) {
      throw error;
    }
  },
}));