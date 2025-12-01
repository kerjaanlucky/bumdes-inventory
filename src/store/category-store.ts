import { create } from 'zustand';
import { Category } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { collection, query, getDocs, addDoc, doc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';

type CategoryState = {
  categories: Category[];
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
  fetchCategories: () => Promise<void>;
  addCategory: (category: { nama_kategori: string }) => Promise<void>;
  editCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
};

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
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

  fetchCategories: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const categoriesRef = collection(firestore, 'categories');
      const q = query(categoriesRef, where("branchId", "==", branchId));
      const querySnapshot = await getDocs(q);
      let categories: Category[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      
      const { searchTerm, page, limit } = get();
      if (searchTerm) {
        categories = categories.filter(c => c.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      
      const total = categories.length;
      const paginatedCategories = categories.slice((page - 1) * limit, page * limit);
      
      set({ categories: paginatedCategories, total: total, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      set({ isFetching: false });
    }
  },

  addCategory: async (category) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    const categoriesRef = collection(firestore, `categories`);
    addDocumentNonBlocking(categoriesRef, { ...category, branchId })
        .then(() => get().fetchCategories())
        .catch(err => console.error("Failed to add category:", err))
        .finally(() => set({ isSubmitting: false }));
  },

  editCategory: async (updatedCategory) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isSubmitting: true });
    const categoryRef = doc(firestore, `categories`, updatedCategory.id);
    setDocumentNonBlocking(categoryRef, updatedCategory, { merge: true })
      .then(() => get().fetchCategories())
      .catch(err => console.error("Failed to edit category:", err))
      .finally(() => set({ isSubmitting: false }));
  },

  deleteCategory: async (categoryId: string) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isDeleting: true });
    const categoryRef = doc(firestore, `categories`, categoryId);
    deleteDocumentNonBlocking(categoryRef)
      .then(() => {
        toast({
            title: "Kategori Dihapus",
            description: "Kategori telah berhasil dihapus.",
        });
        get().fetchCategories();
      })
      .catch(err => console.error("Failed to delete category:", err))
      .finally(() => set({ isDeleting: false }));
  },
}));
