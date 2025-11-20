import { create } from 'zustand';
import { StockMovement, PaginatedResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

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
  fetchMovements: (productId?: number) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => Promise<void>;
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

  fetchMovements: async (productId?: number) => {
    const { page, limit, searchTerm, dateRange } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });

      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }
      if (productId) {
        params.append('productId', String(productId));
      }

      const response = await fetch(`/api/stock?${params.toString()}`);
      const data: PaginatedResponse<StockMovement> = await response.json();
      set({ movements: data.data, total: data.total, page: data.page, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch stock movements:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil riwayat stok." });
    }
  },

  addStockMovement: async (movement) => {
    try {
      await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movement),
      });
      // Optionally re-fetch movements if the page is currently visible
      // For now, we assume the user will navigate to the page to see the update
    } catch (error) {
      console.error("Failed to add stock movement:", error);
      toast({ variant: "destructive", title: "Gagal Mencatat Stok", description: "Terjadi kesalahan saat mencatat pergerakan stok." });
    }
  },
}));
