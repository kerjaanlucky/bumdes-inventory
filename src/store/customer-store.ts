"use client";
import { create } from 'zustand';
import { Customer } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { collection, query, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

type CustomerState = {
  customers: Customer[];
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
  fetchCustomers: () => Promise<void>;
  getCustomerById: (customerId: string) => Promise<Customer | undefined>;
  addCustomer: (customer: Omit<Customer, 'id' | 'branchId'>) => Promise<void>;
  editCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
};

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page, customers: [] }),
  setLimit: (limit) => set({ limit, page: 1, customers: [] }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1, customers: [] }),

  fetchCustomers: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const customersRef = collection(firestore, 'customers');
      const q = query(customersRef, where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);
      let customers: Customer[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));

      const { page, limit, searchTerm } = get();
      if (searchTerm) {
        customers = customers.filter(c =>
          c.nama_customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.telepon?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      const total = customers.length;
      const paginatedCustomers = customers.slice((page - 1) * limit, page * limit);

      set({ customers: paginatedCustomers, total: total, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      set({ isFetching: false });
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Terjadi kesalahan saat mengambil data pelanggan." });
    }
  },

  getCustomerById: async (customerId: string) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const customerRef = doc(firestore, 'customers', customerId);
      const docSnap = await getDoc(customerRef);
      if (docSnap.exists() && docSnap.data().branchId === branchId) {
        return { id: docSnap.id, ...docSnap.data() } as Customer;
      }
      return undefined;
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      toast({ variant: "destructive", title: "Gagal Mengambil Data", description: "Pelanggan tidak ditemukan." });
      return undefined;
    } finally {
      set({ isFetching: false });
    }
  },

  addCustomer: async (customer) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;
    
    set({ isSubmitting: true });
    const customersRef = collection(firestore, 'customers');
    addDocumentNonBlocking(customersRef, { ...customer, branchId })
      .then(() => {
        toast({ title: "Pelanggan Ditambahkan", description: "Pelanggan baru telah berhasil ditambahkan." });
        get().fetchCustomers();
      })
      .catch(err => {
        console.error("Failed to add customer:", err)
        toast({ variant: "destructive", title: "Gagal Menambahkan", description: "Terjadi kesalahan saat menambahkan pelanggan." });
      })
      .finally(() => set({ isSubmitting: false }));
  },

  editCustomer: async (updatedCustomer) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    
    set({ isSubmitting: true });
    const customerRef = doc(firestore, 'customers', updatedCustomer.id);
    setDocumentNonBlocking(customerRef, updatedCustomer, { merge: true })
      .then(() => {
         toast({ title: "Pelanggan Diperbarui", description: "Perubahan pada pelanggan telah berhasil disimpan." });
         get().fetchCustomers();
      })
       .catch(err => {
         console.error("Failed to edit customer:", err);
         toast({ variant: "destructive", title: "Gagal Memperbarui", description: "Terjadi kesalahan saat memperbarui pelanggan." });
       })
      .finally(() => set({ isSubmitting: false }));
  },

  deleteCustomer: async (customerId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isDeleting: true });
    const customerRef = doc(firestore, 'customers', customerId);
    deleteDocumentNonBlocking(customerRef)
      .then(() => {
        toast({ title: "Pelanggan Dihapus", description: "Pelanggan telah berhasil dihapus." });
        get().fetchCustomers();
      })
      .catch(err => {
         console.error("Failed to delete customer:", err);
         toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan saat menghapus pelanggan." });
      })
      .finally(() => set({ isDeleting: false }));
  },
}));
