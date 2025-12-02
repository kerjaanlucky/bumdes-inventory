
"use client";

import { create } from 'zustand';
import { StockMovement, Product } from '@/lib/types';
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
  writeBatch,
} from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking } from '@/firebase';
import { endOfDay } from 'date-fns';

export type StockReport = {
  openingBalance: number;
  closingBalance: number;
  movements: StockMovement[];
}

export type StockValuationItem = {
    id: string;
    kode_produk: string;
    nama_produk: string;
    stock: number;
    harga_modal: number;
    total_value: number;
}

export type StockValuationReport = {
    allItems: StockValuationItem[];
    paginatedItems: StockValuationItem[];
    summary: {
        totalItems: number;
        totalStock: number;
        totalValue: number;
    };
    totalProducts: number;
}

type StockState = {
  movements: StockMovement[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  dateRange?: DateRange;
  isFetching: boolean;
  isDeleting: boolean;
  
  // New state for valuation report
  valuationReport: StockValuationReport | null;
  reportDate: Date;
  
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  setDateRange: (dateRange?: DateRange) => void;
  setReportDate: (date: Date) => void;

  fetchMovements: (productId?: string) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'branchId'>) => Promise<void>;
  fetchStockReport: (productId: string, dateRange: DateRange) => Promise<StockReport | null>;
  fetchStockValuationReport: () => Promise<void>;
  deleteAllStockMovements: () => Promise<void>;
};

export const useStockStore = create<StockState>((set, get) => ({
  movements: [],
  total: 0,
  page: 1,
  limit: 50,
  searchTerm: '',
  dateRange: undefined,
  isFetching: false,
  isDeleting: false,
  valuationReport: null,
  reportDate: new Date(),

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1 }),
  setDateRange: (dateRange?: DateRange) => set({ dateRange, page: 1 }),
  setReportDate: (date: Date) => set({ reportDate: date, page: 1 }),

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
        let openingBalance = 0;
        openingSnapshot.docs.forEach(doc => {
            openingBalance += doc.data().jumlah;
        });

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
  
  fetchStockValuationReport: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    const { reportDate, page, limit } = get();

    if (!firestore || !branchId) return;
    set({ isFetching: true });

    try {
        // 1. Get all products for the branch
        const productsRef = collection(firestore, 'products');
        const productsQuery = query(productsRef, where('branchId', '==', branchId));
        const productsSnapshot = await getDocs(productsQuery);
        const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        // 2. Get all relevant stock movements up to the report date
        const movementsRef = collection(firestore, 'stocks');
        const movementsQuery = query(
            movementsRef,
            where('branchId', '==', branchId),
            where('tanggal', '<=', endOfDay(reportDate).toISOString())
        );
        const movementsSnapshot = await getDocs(movementsQuery);
        
        // 3. Process movements into a map for quick lookup
        const stockMap = new Map<string, number>();
        movementsSnapshot.docs.forEach(doc => {
            const movement = doc.data();
            const currentStock = stockMap.get(movement.produk_id) || 0;
            stockMap.set(movement.produk_id, currentStock + movement.jumlah);
        });

        // 4. Calculate valuation for each product
        const allItems: StockValuationItem[] = allProducts.map(product => {
            const stock = stockMap.get(product.id) || 0;
            return {
                id: product.id,
                kode_produk: product.kode_produk,
                nama_produk: product.nama_produk,
                stock,
                harga_modal: product.harga_modal,
                total_value: stock * product.harga_modal,
            };
        });

        // 5. Calculate summary
        const totalValue = allItems.reduce((acc, item) => acc + item.total_value, 0);
        const totalStock = allItems.reduce((acc, item) => acc + item.stock, 0);
        const totalItems = allItems.length;

        // 6. Paginate results
        const paginatedItems = allItems.slice((page - 1) * limit, page * limit);
        
        set({
            valuationReport: {
                allItems,
                paginatedItems,
                summary: { totalItems, totalStock, totalValue },
                totalProducts: allItems.length,
            },
            isFetching: false,
            total: allItems.length
        });
    } catch (error) {
        console.error("Failed to fetch stock valuation report:", error);
        toast({ variant: "destructive", title: "Gagal Membuat Laporan", description: "Terjadi kesalahan." });
        set({ isFetching: false, valuationReport: null });
    }
  },
  deleteAllStockMovements: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isDeleting: true });
    try {
        const stocksRef = collection(firestore, 'stocks');
        const q = query(stocksRef, where("branchId", "==", branchId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        get().fetchMovements();
    } catch(err) {
        console.error("Failed to delete all stock movements:", err);
    } finally {
        set({ isDeleting: false });
    }
  },
}));
