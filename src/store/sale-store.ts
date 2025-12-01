"use client";
import { create } from 'zustand';
import { Sale, PaginatedResponse, SaleItem } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { useProductStore } from './product-store';
import { useStockStore } from './stock-store';
import {
  collection,
  query,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  where,
} from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useCustomerStore } from './customer-store';

type SaleState = {
  sales: Sale[];
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
  fetchSales: () => Promise<void>;
  getSaleById: (saleId: string) => Promise<Sale | undefined>;
  addSale: (sale: Omit<Sale, 'id' | 'nomor_penjualan' | 'created_at' | 'status' | 'branchId'>) => Promise<Sale | undefined>;
  editSale: (sale: Sale) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
};

export const useSaleStore = create<SaleState>((set, get) => ({
  sales: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, sales: [] }),
  setLimit: (limit) => set({ limit, page: 1, sales: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, sales: [] }),

  fetchSales: async () => {
    // Implement fetch logic similar to purchase-store if needed
  },

  getSaleById: async (saleId: string) => {
    // Implement get by ID logic if needed
    return undefined;
  },

  addSale: async (sale) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    try {
      const salesRef = collection(firestore, 'sales');
      const soNumber = `SO-${Date.now()}`; 
      
      const newSaleData: Omit<Sale, 'id'> = {
        ...sale,
        branchId,
        nomor_penjualan: soNumber,
        status: 'LUNAS',
        created_at: new Date().toISOString(),
      };

      const docRef = await addDoc(salesRef, newSaleData);
      
      // Update stock and add stock movement for each item
      const { getProductById, editProduct } = useProductStore.getState();
      const { addStockMovement } = useStockStore.getState();

      for (const item of sale.items) {
          const product = await getProductById(item.produk_id);
          if (product) {
              const newStock = product.stok - item.jumlah;
              await editProduct({ ...product, stok: newStock }, true);
              await addStockMovement({
                  tanggal: new Date().toISOString(),
                  produk_id: product.id,
                  nama_produk: product.nama_produk,
                  nama_satuan: product.nama_satuan || 'N/A',
                  tipe: 'Penjualan Keluar',
                  jumlah: -item.jumlah,
                  stok_akhir: newStock,
                  referensi: soNumber,
              });
          }
      }

      toast({ title: "Penjualan Berhasil", description: "Transaksi penjualan telah berhasil disimpan." });
      
      const customerName = useCustomerStore.getState().customers.find(c => c.id === sale.customer_id)?.nama_customer || 'N/A';
      const saleWithCustomerName = { id: docRef.id, ...newSaleData, nama_customer: customerName };

      // Optimistically update state if needed, or re-fetch
      // get().fetchSales();

      return saleWithCustomerName;

    } catch (error) {
      console.error("Failed to add sale:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Terjadi kesalahan saat menyimpan penjualan." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editSale: async (updatedSale) => {
    // Implement edit logic if needed
  },

  deleteSale: async (saleId: string) => {
    // Implement delete logic if needed
  },
}));
