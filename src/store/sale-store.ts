

"use client";
import { create } from 'zustand';
import { Sale, PaginatedResponse, SaleItem, SaleStatus, SaleStatusHistory } from '@/lib/types';
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
  addSale: (sale: Omit<Sale, 'id' | 'nomor_penjualan' | 'created_at' | 'status' | 'branchId' | 'history'> & { items: SaleItem[] }) => Promise<Sale | undefined>;
  editSale: (sale: Sale) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;
  updateSaleStatus: (saleId: string, status: SaleStatus, note?: string) => Promise<void>;
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
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    const { page, limit, searchTerm } = get();
    set({ isFetching: true });

    try {
      const customersRef = collection(firestore, 'customers');
      const customerQuery = query(customersRef, where("branchId", "==", branchId));
      const customersSnapshot = await getDocs(customerQuery);
      const customersMap = new Map(customersSnapshot.docs.map(doc => [doc.id, doc.data().nama_customer]));

      const salesRef = collection(firestore, 'sales');
      const q = query(salesRef, where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);
      
      let salesData: Sale[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Sale;
        return {
          id: doc.id,
          ...data,
          nama_customer: customersMap.get(data.customer_id) || 'N/A'
        };
      });

      if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        salesData = salesData.filter(s => 
          s.nomor_penjualan.toLowerCase().includes(lowercasedFilter) ||
          s.nama_customer?.toLowerCase().includes(lowercasedFilter)
        );
      }

      const total = salesData.length;
      const paginatedSales = salesData.slice((page - 1) * limit, page * limit);
      
      set({ sales: paginatedSales, total, isFetching: false });

    } catch (error) {
      console.error("Failed to fetch sales:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data penjualan." });
      set({ isFetching: false });
    }
  },

  getSaleById: async (saleId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return undefined;
    
    set({ isFetching: true });
    try {
      const saleRef = doc(firestore, 'sales', saleId);
      const docSnap = await getDoc(saleRef);
      if(docSnap.exists() && docSnap.data().branchId === branchId) {
        const saleData = { id: docSnap.id, ...docSnap.data() } as Sale;
        // Fetch customer name if not present
        if(saleData.customer_id && !saleData.nama_customer) {
            const customerRef = doc(firestore, 'customers', saleData.customer_id);
            const customerSnap = await getDoc(customerRef);
            if(customerSnap.exists()) {
                saleData.nama_customer = customerSnap.data().nama_customer;
            }
        }
        return saleData;
      }
      return undefined;
    } catch(error) {
      console.error("Failed to fetch sale:", error);
      return undefined;
    } finally {
        set({ isFetching: false });
    }
  },

  addSale: async (sale) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId, user } = useAuthStore.getState();
    if (!firestore || !branchId || !user) return;

    set({ isSubmitting: true });
    try {
      const salesRef = collection(firestore, 'sales');
      const soNumber = `SO-${Date.now()}`; 
      
      const newSaleData: Omit<Sale, 'id'> = {
        ...sale,
        branchId,
        nomor_penjualan: soNumber,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
        history: [{
          status: 'DRAFT',
          tanggal: new Date().toISOString(),
          oleh: user.displayName || 'System'
        }]
      };

      const docRef = await addDoc(salesRef, newSaleData);
      
      toast({ title: "Draft Penjualan Disimpan", description: "Transaksi penjualan telah berhasil disimpan sebagai draft." });
      
      get().fetchSales();

      return { id: docRef.id, ...newSaleData };

    } catch (error) {
      console.error("Failed to add sale:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Terjadi kesalahan saat menyimpan penjualan." });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editSale: async (updatedSale) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    
    set({isSubmitting: true});
    const saleRef = doc(firestore, 'sales', updatedSale.id);
    const { nama_customer, ...saleToSave } = updatedSale;
    try {
      await setDoc(saleRef, saleToSave, { merge: true });
      toast({ title: "Penjualan Diperbarui", description: "Perubahan pada penjualan telah berhasil disimpan." });
      // Optimistically update local state
      set(state => ({
        sales: state.sales.map(s => s.id === updatedSale.id ? updatedSale : s)
      }));
    } catch (error) {
      console.error("Failed to edit sale:", error);
    } finally {
      set({isSubmitting: false});
    }
  },

  deleteSale: async (saleId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isDeleting: true });
    const saleRef = doc(firestore, 'sales', saleId);
    deleteDocumentNonBlocking(saleRef)
      .then(() => {
        toast({ title: "Penjualan Dihapus", description: "Transaksi penjualan telah berhasil dihapus." });
        get().fetchSales();
      })
      .catch(err => {
         console.error("Failed to delete sale:", err);
         toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus penjualan." });
      })
      .finally(() => set({ isDeleting: false }));
  },

  updateSaleStatus: async (saleId, status, note) => {
    const { firestore, auth } = useFirebaseStore.getState();
    if (!firestore || !auth?.currentUser) return;

    set({ isSubmitting: true });
    const sale = await get().getSaleById(saleId);
    if(!sale) {
        set({ isSubmitting: false });
        return;
    }

    const newHistoryEntry: SaleStatusHistory = {
        status: status,
        tanggal: new Date().toISOString(),
        oleh: auth.currentUser.displayName || 'System',
        catatan: note
    };

    const updatedSale: Sale = {
        ...sale,
        status: status,
        history: [...(sale.history || []), newHistoryEntry]
    };

    if (status === 'DIKIRIM') {
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
                    referensi: sale.nomor_penjualan,
                });
            }
        }
    }
    
    if (status === 'DIRETUR') {
        const { getProductById, editProduct } = useProductStore.getState();
        const { addStockMovement } = useStockStore.getState();
        for (const item of sale.items) {
            const product = await getProductById(item.produk_id);
            if (product) {
                const newStock = product.stok + item.jumlah;
                await editProduct({ ...product, stok: newStock }, true);
                await addStockMovement({
                    tanggal: new Date().toISOString(),
                    produk_id: product.id,
                    nama_produk: product.nama_produk,
                    nama_satuan: product.nama_satuan || 'N/A',
                    tipe: 'Retur Penjualan',
                    jumlah: item.jumlah,
                    stok_akhir: newStock,
                    referensi: sale.nomor_penjualan,
                });
            }
        }
        toast({ title: "Retur Diproses", description: "Stok telah dikembalikan ke persediaan." });
    }


    await get().editSale(updatedSale);
    set({ isSubmitting: false });
  },
}));
