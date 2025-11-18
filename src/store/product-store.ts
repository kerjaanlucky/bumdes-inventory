import { create } from 'zustand';
import { Product, PaginatedResponse } from '@/lib/types';

type ProductState = {
  products: Product[];
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
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  editProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  getProductById: (productId: number) => Promise<Product | undefined>;
};

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  setPage: (page) => set({ page, products: [] }), // Clear products to show loading state
  setLimit: (limit) => set({ limit, page: 1, products: [] }), // Reset to page 1
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, products: [] }), // Reset to page 1
  
  fetchProducts: async () => {
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      const data: PaginatedResponse<Product> = await response.json();
      set({ 
        products: data.data,
        total: data.total,
        page: data.page,
        isFetching: false 
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      set({ isFetching: false });
    }
  },

  addProduct: async (product) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (response.ok) {
        await get().fetchProducts(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to add product:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  editProduct: async (updatedProduct) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
       if (response.ok) {
        await get().fetchProducts(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to edit product:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteProduct: async (productId) => {
    set({ isDeleting: true });
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (response.ok) {
        await get().fetchProducts(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      set({ isDeleting: false });
    }
  },
  
  getProductById: async (productId: number) => {
    set({ isFetching: true });
    try {
      const response = await fetch(`/api/products/${productId}`);
      const product: Product = await response.json();
      return product;
    } catch (error) {
      console.error("Failed to fetch product:", error);
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },
}));
