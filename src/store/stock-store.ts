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
} from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking } from '@/firebase';

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

    const { page, limit, searchTerm, dateRange } = get();
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
      if (dateRange?.from) {
        queryConstraints.push(where('tanggal', '>=', dateRange.from.toISOString()));
      }
      if (dateRange?.to) {
        queryConstraints.push(where('tanggal', '<=', dateRange.to.toISOString()));
      }

      // Count total documents for pagination
      const countQuery = query(movementsRef, ...queryConstraints);
      const snapshot = await getCountFromServer(countQuery);
      const total = snapshot.data().count;

      // Fetch paginated documents
      const finalQueryConstraints = [
        ...queryConstraints,
        orderBy('tanggal', 'desc'),
        firestoreLimit(limit)
      ];

      // For pagination, we need to get the last document of the previous page
      if (page > 1) {
        const prevPageQuery = query(movementsRef, ...queryConstraints, orderBy('tanggal', 'desc'), firestoreLimit((page - 1) * limit));
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
      ].filter(Boolean); // Remove empty strings

      const movementData = { 
        ...movement, 
        branchId,
        searchable_keywords: Array.from(new Set(searchableKeywords)) // Ensure unique keywords
      };
      await addDocumentNonBlocking(stocksRef, movementData);
    } catch (error) {
      console.error("Failed to add stock movement:", error);
      toast({ variant: "destructive", title: "Gagal Mencatat Stok", description: "Terjadi kesalahan saat mencatat pergerakan stok." });
    }
  },
}));

    