"use client";

import { create } from 'zustand';
import { StockOpname, StockOpnameItem, StockOpnameStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { collection, query, getDocs, addDoc, doc, setDoc, getDoc, where } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { useProductStore } from './product-store';
import { useStockStore } from './stock-store';
import { format } from 'date-fns';

type StockOpnameState = {
  stockOpnames: StockOpname[];
  isFetching: boolean;
  isSubmitting: boolean;
  fetchStockOpnames: () => Promise<void>;
  getStockOpnameById: (id: string) => Promise<StockOpname | undefined>;
  addStockOpname: (opnameData: Omit<StockOpname, 'id' | 'branchId' | 'status' | 'nomor_referensi'>) => Promise<void>;
  finalizeStockOpname: (id: string) => Promise<void>;
};

export const useStockOpnameStore = create<StockOpnameState>((set, get) => ({
  stockOpnames: [],
  isFetching: false,
  isSubmitting: false,

  fetchStockOpnames: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const opnamesRef = collection(firestore, 'stockOpnames');
      const q = query(opnamesRef, where("branchId", "==", branchId));
      const snapshot = await getDocs(q);
      const opnames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockOpname));
      set({ stockOpnames: opnames, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch stock opnames:", error);
      toast({ variant: "destructive", title: "Gagal", description: "Tidak dapat memuat data stock opname." });
      set({ isFetching: false });
    }
  },

  getStockOpnameById: async (id) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;
    
    set({ isFetching: true });
    try {
      const docRef = doc(firestore, 'stockOpnames', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        return { id: docSnap.id, ...docSnap.data() } as StockOpname;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to get stock opname by id:", error);
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addStockOpname: async (opnameData) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId, user } = useAuthStore.getState();
    if (!firestore || !branchId || !user) return;
    
    set({ isSubmitting: true });
    try {
      const newDoc: Omit<StockOpname, 'id'> = {
        ...opnameData,
        branchId,
        status: 'DRAFT',
        nomor_referensi: `SO-${Date.now()}`,
        tanggal: format(opnameData.tanggal, 'yyyy-MM-dd'),
      };
      await addDoc(collection(firestore, 'stockOpnames'), newDoc);
    } catch (error) {
      console.error("Failed to add stock opname:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  finalizeStockOpname: async (id) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId, user } = useAuthStore.getState();
    const { getProductById, editProduct } = useProductStore.getState();
    const { addStockMovement } = useStockStore.getState();
    if (!firestore || !branchId || !user) return;
    
    set({ isSubmitting: true });
    const opname = await get().getStockOpnameById(id);
    if (!opname || opname.status === 'SELESAI') {
      toast({ variant: "destructive", title: "Gagal", description: "Stock opname tidak ditemukan atau sudah selesai." });
      set({ isSubmitting: false });
      return;
    }
    
    try {
      // Logic to update all product stocks and create stock movements
      for (const item of opname.items) {
        if (item.selisih !== 0) {
          const product = await getProductById(item.produk_id);
          if (product) {
            await editProduct({ ...product, stok: item.stok_fisik }, true); // true for silent stock update
            await addStockMovement({
              tanggal: new Date().toISOString(),
              produk_id: item.produk_id,
              nama_produk: item.nama_produk,
              nama_satuan: item.nama_satuan,
              tipe: 'Penyesuaian',
              jumlah: item.selisih,
              stok_akhir: item.stok_fisik,
              referensi: opname.nomor_referensi,
            });
          }
        }
      }

      // Update the stock opname status to 'SELESAI'
      const opnameRef = doc(firestore, 'stockOpnames', id);
      await setDoc(opnameRef, { status: 'SELESAI' }, { merge: true });
      toast({ title: "Sukses", description: "Stok telah berhasil disesuaikan." });
    } catch (error) {
      console.error("Failed to finalize stock opname:", error);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat finalisasi." });
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
