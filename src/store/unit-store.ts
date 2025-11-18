import { create } from 'zustand';
import { Unit, PaginatedResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

type UnitState = {
  units: Unit[];
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
  fetchUnits: () => Promise<void>;
  addUnit: (unit: { nama_satuan: string }) => Promise<void>;
  editUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (unitId: number) => Promise<void>;
};

export const useUnitStore = create<UnitState>((set, get) => ({
  units: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1 }),

  fetchUnits: async () => {
    const { page, limit, searchTerm } = get();
    set({ isFetching: true });
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
      });
      const response = await fetch(`/api/units?${params.toString()}`);
      const data: PaginatedResponse<Unit> = await response.json();
      set({ units: data.data, total: data.total, page: data.page, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch units:", error);
      set({ isFetching: false });
    }
  },

  addUnit: async (unit) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unit),
      });
      if (response.ok) {
        await get().fetchUnits();
      }
    } catch (error) {
      console.error("Failed to add unit:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  editUnit: async (updatedUnit) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/units/${updatedUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUnit),
      });
      if (response.ok) {
        await get().fetchUnits();
      }
    } catch (error) {
      console.error("Failed to edit unit:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteUnit: async (unitId) => {
    set({ isDeleting: true });
    try {
      const response = await fetch(`/api/units/${unitId}`, { method: 'DELETE' });
      if (response.ok) {
        const { isOrphan } = await response.json();
        if (isOrphan) {
            toast({
                variant: "destructive",
                title: "Peringatan: Data Yatim Piatu",
                description: "Satuan telah dihapus, tetapi beberapa produk yang terkait menjadi yatim piatu. Harap perbarui produk tersebut.",
            });
        }
        await get().fetchUnits();
      }
    } catch (error) {
      console.error("Failed to delete unit:", error);
    } finally {
      set({ isDeleting: false });
    }
  },
}));
