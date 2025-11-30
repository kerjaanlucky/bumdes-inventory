"use client";
import { create } from 'zustand';
import { Supplier, PaginatedResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { collection, query, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

type SupplierState = {
  suppliers: Supplier[];
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
  fetchSuppliers: () => Promise<void>;
  getSupplierById: (supplierId: string) => Promise<Supplier | undefined>;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'branch_id'>) => Promise<void>;
  editSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
};

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, suppliers: [] }),
  setLimit: (limit) => set({ limit, page: 1, suppliers: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, suppliers: [] }),

  fetchSuppliers: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const suppliersRef = collection(firestore, `branches/${branchId}/suppliers`);
      const q = query(suppliersRef);
      const querySnapshot = await getDocs(q);
      let suppliers: Supplier[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));

      const { page, limit, searchTerm } = get();
       if (searchTerm) {
        suppliers = suppliers.filter(s =>
          s.nama_supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.telepon?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      const total = suppliers.length;
      const paginatedSuppliers = suppliers.slice((page - 1) * limit, page * limit);

      set({ suppliers: paginatedSuppliers, total: total, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data pemasok." });
    }
  },

  getSupplierById: async (supplierId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const supplierRef = doc(firestore, `branches/${branchId}/suppliers`, supplierId);
      const docSnap = await getDoc(supplierRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Supplier;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to fetch supplier:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Pemasok tidak ditemukan." });
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addSupplier: async (supplier) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    const suppliersRef = collection(firestore, `branches/${branchId}/suppliers`);
    addDocumentNonBlocking(suppliersRef, { ...supplier, branchId })
      .then(() => {
        toast({ title: "Pemasok Ditambahkan", description: "Pemasok baru telah berhasil ditambahkan." });
        get().fetchSuppliers();
      })
      .catch(err => {
        console.error("Failed to add supplier:", err);
        toast({ variant: "destructive", title: "Gagal Menambahkan", description: "Terjadi kesalahan saat menambahkan pemasok." });
      })
      .finally(() => set({ isSubmitting: false }));
  },

  editSupplier: async (updatedSupplier) => {
     const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    const supplierRef = doc(firestore, `branches/${branchId}/suppliers`, updatedSupplier.id);
    setDocumentNonBlocking(supplierRef, updatedSupplier, { merge: true })
      .then(() => {
         toast({ title: "Pemasok Diperbarui", description: "Perubahan pada pemasok telah berhasil disimpan." });
        get().fetchSuppliers();
      })
      .catch(err => {
         console.error("Failed to edit supplier:", err);
         toast({ variant: "destructive", title: "Gagal Memperbarui", description: "Terjadi kesalahan saat memperbarui pemasok." });
      })
      .finally(() => set({ isSubmitting: false }));
  },

  deleteSupplier: async (supplierId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isDeleting: true });
    const supplierRef = doc(firestore, `branches/${branchId}/suppliers`, supplierId);
    deleteDocumentNonBlocking(supplierRef)
      .then(() => {
        toast({ title: "Pemasok Dihapus", description: "Pemasok telah berhasil dihapus." });
        get().fetchSuppliers();
      })
      .catch(err => {
        console.error("Failed to delete supplier:", err);
        toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus pemasok." });
      })
      .finally(() => set({ isDeleting: false }));
  },
}));
