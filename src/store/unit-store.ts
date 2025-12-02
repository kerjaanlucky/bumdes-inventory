import { create } from 'zustand';
import { Unit } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { collection, query, getDocs, addDoc, doc, setDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

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
  deleteUnit: (unitId: string) => Promise<void>;
  deleteAllUnits: () => Promise<void>;
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
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const unitsRef = collection(firestore, `units`);
      const q = query(unitsRef, where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);
      let units: Unit[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));

      const { searchTerm, page, limit } = get();
      if (searchTerm) {
        units = units.filter(u => u.nama_satuan.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      
      const total = units.length;
      const paginatedUnits = units.slice((page - 1) * limit, page * limit);
      
      set({ units: paginatedUnits, total: total, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch units:", error);
      set({ isFetching: false });
    }
  },

  addUnit: async (unit) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    const unitsRef = collection(firestore, `units`);
    addDocumentNonBlocking(unitsRef, { ...unit, branchId })
        .then(() => get().fetchUnits())
        .catch(err => console.error("Failed to add unit:", err))
        .finally(() => set({ isSubmitting: false }));
  },

  editUnit: async (updatedUnit) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isSubmitting: true });
    const unitRef = doc(firestore, `units`, updatedUnit.id);
    setDocumentNonBlocking(unitRef, updatedUnit, { merge: true })
      .then(() => get().fetchUnits())
      .catch(err => console.error("Failed to edit unit:", err))
      .finally(() => set({ isSubmitting: false }));
  },

  deleteUnit: async (unitId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isDeleting: true });
    const unitRef = doc(firestore, `units`, unitId);
    try {
      await deleteDoc(unitRef);
      toast({ title: "Satuan Dihapus" });
      get().fetchUnits();
    } catch (error) {
      console.error("Failed to delete unit:", error);
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Tidak dapat menghapus satuan. Mungkin sedang digunakan oleh produk." });
    } finally {
        set({ isDeleting: false });
    }
  },
  
  deleteAllUnits: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;
    
    set({ isDeleting: true });
    try {
        const unitsRef = collection(firestore, 'units');
        const q = query(unitsRef, where("branchId", "==", branchId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        get().fetchUnits();
    } catch(err) {
        console.error("Failed to delete all units:", err);
    } finally {
        set({ isDeleting: false });
    }
  },
}));
