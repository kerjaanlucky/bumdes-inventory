
import { create } from 'zustand';
import { StockMovement } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  doc,
  getCountFromServer,
  Timestamp,
} from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking } from '@/firebase';

export type StockReport = {
  openingBalance: number;
  closingBalance: number;
  movements: StockMovement[];
}

type StockState = {
  movements: StockMovement[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  dateRange?: DateRange;
  isFetching: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  setDateRange: (dateRange?: DateRange) => void;
  fetchMovements: (productId?: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'branchId'>) => Promise<void>;
  fetchStockReport: (productId: string, dateRange: DateRange) => Promise<StockReport | null>;
};

export const useStockStore = create<StockState>((set, get) => ({
  movements: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  dateRange: undefined,
  isFetching: false,

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1 }),
  setDateRange: (dateRange?: DateRange) => set({ dateRange, page: 1 }),

  fetchMovements: async (productId?: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    const { page, limit, searchTerm } = get();
    set({ isFetching: true });

    try {
      const movementsRef = collection(firestore, 'stocks');
      let queryConstraints = [where('branchId', '==', branchId)];

      if (productId) {
        queryConstraints.push(where('produk_id', '==', productId));
      }
      if (searchTerm) {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        queryConstraints.push(
          where('searchable_keywords', 'array-contains', lowercasedSearchTerm)
        );
      }

      // Count total documents for pagination
      const countQuery = query(movementsRef, ...queryConstraints);
      const snapshot = await getCountFromServer(countQuery);
      const total = snapshot.data().count;

      const finalQueryConstraints = [
        ...queryConstraints,
        orderBy('tanggal', 'desc'),
        firestoreLimit(limit),
      ];
      
      // Pagination logic
      if (page > 1) {
        const prevPageQuery = query(movementsRef, ...finalQueryConstraints.slice(0, -1), firestoreLimit((page - 1) * limit));
        const prevPageSnapshot = await getDocs(prevPageQuery);
        const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        if (lastVisible) {
            finalQueryConstraints.push(startAfter(lastVisible));
        }
      }

      const paginatedQuery = query(movementsRef, ...finalQueryConstraints);
      const querySnapshot = await getDocs(paginatedQuery);
      const movements: StockMovement[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));

      set({ movements, total, isFetching: false });

    } catch (error) {
      console.error("Failed to fetch stock movements:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil riwayat stok." });
    }
  },

  addStockMovement: async (movement) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    try {
      const stocksRef = collection(firestore, `stocks`);
      const searchableKeywords = [
        ...movement.nama_produk.toLowerCase().split(' '),
        ...movement.referensi.toLowerCase().split(' ')
      ].filter(Boolean);

      const movementData = { 
        ...movement, 
        branchId,
        searchable_keywords: Array.from(new Set(searchableKeywords))
      };
      await addDocumentNonBlocking(stocksRef, movementData);
    } catch (error) {
      console.error("Failed to add stock movement:", error);
      toast({ variant: "destructive", title: "Gagal Mencatat Stok", description: "Terjadi kesalahan saat mencatat pergerakan stok." });
    }
  },

  fetchStockReport: async (productId, dateRange) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId || !dateRange.from) return null;

    set({ isFetching: true });
    try {
        const movementsRef = collection(firestore, 'stocks');
        
        // 1. Calculate Opening Balance
        const openingBalanceQuery = query(
            movementsRef,
            where('branchId', '==', branchId),
            where('produk_id', '==', productId),
            where('tanggal', '<', dateRange.from.toISOString())
        );
        const openingSnapshot = await getDocs(openingBalanceQuery);
        const openingBalance = openingSnapshot.docs.reduce((acc, doc) => acc + doc.data().jumlah, 0);

        // 2. Get Movements within Date Range
        const movementsQuery = query(
            movementsRef,
            where('branchId', '==', branchId),
            where('produk_id', '==', productId),
            where('tanggal', '>=', dateRange.from.toISOString()),
            where('tanggal', '<=', dateRange.to ? dateRange.to.toISOString() : new Date().toISOString()),
            orderBy('tanggal', 'asc')
        );
        const movementsSnapshot = await getDocs(movementsQuery);
        const movements = movementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));

        // 3. Calculate running balance and closing balance
        let runningBalance = openingBalance;
        const movementsWithRunningBalance = movements.map(m => {
            runningBalance += m.jumlah;
            return { ...m, stok_akhir: runningBalance };
        });

        return {
            openingBalance,
            movements: movementsWithRunningBalance,
            closingBalance: runningBalance,
        };

    } catch (error) {
        console.error("Failed to fetch stock report:", error);
        toast({ variant: "destructive", title: "Gagal Membuat Laporan", description: "Terjadi kesalahan." });
        return null;
    } finally {
        set({ isFetching: false });
    }
  },
}));

    