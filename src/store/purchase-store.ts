"use client";
import { create } from 'zustand';
import { Purchase, PaginatedResponse, PurchaseStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type PurchaseState = {
  purchases: Purchase[];
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
  fetchPurchases: () => Promise<void>;
  getPurchaseById: (purchaseId: number) => Promise<Purchase | undefined>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'nomor_pembelian' | 'created_at' | 'status'>) => Promise<void>;
  editPurchase: (purchase: Purchase) => Promise<void>;
  deletePurchase: (purchaseId: number) => Promise<void>;
  updatePurchaseStatus: (purchaseId: number, status: PurchaseStatus) => Promise<void>;
};

export const usePurchaseStore = create<PurchaseState>((set, get) => ({
  purchases: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, purchases: [] }),
  setLimit: (limit) => set({ limit, page: 1, purchases: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, purchases: [] }),

  fetchPurchases: async () => {
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/purchases?${params.toString()}`);
      const data: PaginatedResponse<Purchase> = await response.json();
      set({ purchases: data.data, total: data.total, page: data.page, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data pembelian." });
    }
  },

  getPurchaseById: async (purchaseId: number) => {
    set({ isFetching: true });
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`);
      if (!response.ok) throw new Error("Purchase not found");
      const purchase: Purchase = await response.json();
      return purchase;
    } catch (error) {
      console.error("Failed to fetch purchase:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Data pembelian tidak ditemukan." });
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addPurchase: async (purchase) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
      });
      if (response.ok) {
        toast({ title: "Pembelian Ditambahkan", description: "Draft pembelian baru telah berhasil dibuat." });
        await get().fetchPurchases();
         return await response.json();
      } else {
        throw new Error("Failed to add purchase");
      }
    } catch (error) {
      console.error("Failed to add purchase:", error);
      toast({ variant: "destructive", title: "Gagal Menambahkan", description: "Terjadi kesalahan saat menambahkan pembelian." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editPurchase: async (updatedPurchase) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/purchases/${updatedPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPurchase),
      });
      if (response.ok) {
         toast({ title: "Pembelian Diperbarui", description: "Perubahan pada pembelian telah berhasil disimpan." });
        // Don't refetch all, just update the single item in the list if it exists
        set(state => ({
            purchases: state.purchases.map(p => p.id === updatedPurchase.id ? updatedPurchase : p)
        }));
      } else {
        throw new Error("Failed to edit purchase");
      }
    } catch (error) {
      console.error("Failed to edit purchase:", error);
       toast({ variant: "destructive", title: "Gagal Memperbarui", description: "Terjadi kesalahan saat memperbarui pembelian." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  deletePurchase: async (purchaseId) => {
    set({ isDeleting: true });
    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Pembelian Dihapus", description: "Data pembelian telah berhasil dihapus." });
        await get().fetchPurchases();
      } else {
         throw new Error("Failed to delete purchase");
      }
    } catch (error) {
      console.error("Failed to delete purchase:", error);
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus pembelian." });
    } finally {
      set({ isDeleting: false });
    }
  },
  
  updatePurchaseStatus: async (purchaseId: number, status: PurchaseStatus) => {
    const currentPurchase = get().purchases.find(p => p.id === purchaseId) 
      || await get().getPurchaseById(purchaseId);

    if (!currentPurchase) {
      toast({ variant: "destructive", title: "Gagal", description: "Pembelian tidak ditemukan." });
      return;
    }

    set({ isSubmitting: true });
    try {
      const updatedPurchase = { 
        ...currentPurchase, 
        status,
        history: [
            ...(currentPurchase.history || []),
            { status, tanggal: new Date().toISOString(), oleh: 'System' }
        ]
      };
      
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPurchase),
      });

      if (response.ok) {
        toast({ title: "Status Diperbarui", description: `Status pembelian diubah menjadi ${status}.` });
        set(state => ({
            purchases: state.purchases.map(p => p.id === purchaseId ? updatedPurchase : p)
        }));
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({ variant: "destructive", title: "Gagal Memperbarui Status", description: "Terjadi kesalahan." });
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
