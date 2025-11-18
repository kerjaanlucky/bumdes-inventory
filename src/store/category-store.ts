import { create } from 'zustand';
import { Category, PaginatedResponse } from '@/lib/types';

type CategoryState = {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  fetchCategories: () => Promise<void>;
  addCategory: (category: { nama_kategori: string }) => Promise<void>;
  editCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: number) => Promise<void>;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1 }),

  fetchCategories: async () => {
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/categories?${params.toString()}`);
      const data: PaginatedResponse<Category> = await response.json();
      set({ categories: data.data, total: data.total, page: data.page, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      set({ isFetching: false });
    }
  },

  addCategory: async (category) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (response.ok) {
        await get().fetchCategories();
      }
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  editCategory: async (updatedCategory) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/categories/${updatedCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCategory),
      });
      if (response.ok) {
        await get().fetchCategories();
      }
    } catch (error) {
      console.error("Failed to edit category:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteCategory: async (categoryId) => {
    set({ isDeleting: true });
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (response.ok) {
        await get().fetchCategories();
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      set({ isDeleting: false });
    }
  },
}));
