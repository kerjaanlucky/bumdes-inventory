"use client";
import { create } from 'zustand';
import { Supplier, PaginatedResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type SupplierState = {
  suppliers: Supplier[];
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
  fetchSuppliers: () => Promise<void>;
  getSupplierById: (supplierId: number) => Promise<Supplier | undefined>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'tenant_id'>) => Promise<void>;
  editSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierId: number) => Promise<void>;
};

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, suppliers: [] }),
  setLimit: (limit) => set({ limit, page: 1, suppliers: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, suppliers: [] }),

  fetchSuppliers: async () => {
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/suppliers?${params.toString()}`);
      const data: PaginatedResponse<Supplier> = await response.json();
      set({ suppliers: data.data, total: data.total, page: data.page, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data pemasok." });
    }
  },

  getSupplierById: async (supplierId: number) => {
    set({ isFetching: true });
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`);
       if (!response.ok) throw new Error("Supplier not found");
      const supplier: Supplier = await response.json();
      return supplier;
    } catch (error) {
      console.error("Failed to fetch supplier:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Pemasok tidak ditemukan." });
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addSupplier: async (supplier) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier),
      });
      if (response.ok) {
        toast({ title: "Pemasok Ditambahkan", description: "Pemasok baru telah berhasil ditambahkan." });
        await get().fetchSuppliers();
      } else {
        throw new Error("Failed to add supplier");
      }
    } catch (error) {
      console.error("Failed to add supplier:", error);
      toast({ variant: "destructive", title: "Gagal Menambahkan", description: "Terjadi kesalahan saat menambahkan pemasok." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editSupplier: async (updatedSupplier) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/suppliers/${updatedSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSupplier),
      });
      if (response.ok) {
         toast({ title: "Pemasok Diperbarui", description: "Perubahan pada pemasok telah berhasil disimpan." });
        await get().fetchSuppliers();
      } else {
         throw new Error("Failed to edit supplier");
      }
    } catch (error) {
      console.error("Failed to edit supplier:", error);
      toast({ variant: "destructive", title: "Gagal Memperbarui", description: "Terjadi kesalahan saat memperbarui pemasok." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteSupplier: async (supplierId) => {
    set({ isDeleting: true });
    try {
      const response = await fetch(`/api/suppliers/${supplierId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Pemasok Dihapus", description: "Pemasok telah berhasil dihapus." });
        await get().fetchSuppliers();
      } else {
        throw new Error("Failed to delete supplier");
      }
    } catch (error) {
      console.error("Failed to delete supplier:", error);
       toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus pemasok." });
    } finally {
      set({ isDeleting: false });
    }
  },
}));
