import { create } from 'zustand';
import { StockMovement, PaginatedResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  orderBy,
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

  setPage: (page) => set({ page, movements: [] }),
  setLimit: (limit) => set({ limit, page: 1, movements: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, movements: [] }),
  setDateRange: (dateRange?: DateRange) => set({ dateRange, page: 1, movements: [] }),

  fetchMovements: async (productId?: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    const { page, limit, searchTerm, dateRange } = get();
    set({ isFetching: true });

    try {
      const movementsRef = collection(firestore, `stocks`);
      let queries = [
          where('branchId', '==', branchId),
          orderBy('tanggal', 'desc')
        ];

      if (productId) {
        queries.push(where('produk_id', '==', productId));
      }
      if (dateRange?.from) {
        queries.push(where('tanggal', '>=', dateRange.from.toISOString()));
      }
      if (dateRange?.to) {
        queries.push(where('tanggal', '<=', dateRange.to.toISOString()));
      }
      
      const q = query(movementsRef, ...queries);
      const querySnapshot = await getDocs(q);
      let movements: StockMovement[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));

      if (searchTerm) {
        movements = movements.filter(m =>
          m.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.referensi.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      const total = movements.length;
      const paginatedMovements = movements.slice((page - 1) * limit, page * limit);
      
      set({ movements: paginatedMovements, total: total, isFetching: false });

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
      await addDocumentNonBlocking(stocksRef, {...movement, branchId});
    } catch (error) {
      console.error("Failed to add stock movement:", error);
      toast({ variant: "destructive", title: "Gagal Mencatat Stok", description: "Terjadi kesalahan saat mencatat pergerakan stok." });
    }
  },
}));
