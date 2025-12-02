import { create } from 'zustand';
import { Expense, ExpenseCategory } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import {
  collection,
  query,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { useFirebaseStore } from './firebase-store';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay } from 'date-fns';

// == CATEGORY STATE ==
type ExpenseCategoryState = {
  expenseCategories: ExpenseCategory[];
  fetchExpenseCategories: () => Promise<void>;
  addExpenseCategory: (category: { nama_kategori: string }) => Promise<void>;
  editExpenseCategory: (category: ExpenseCategory) => Promise<void>;
  deleteExpenseCategory: (categoryId: string) => Promise<void>;
};

export const useExpenseCategoryStore = create<ExpenseCategoryState>((set, get) => ({
  expenseCategories: [],
  fetchExpenseCategories: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    try {
      const categoriesRef = collection(firestore, 'expenseCategories');
      const q = query(categoriesRef, where("branchId", "==", branchId), orderBy("nama_kategori"));
      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExpenseCategory));
      set({ expenseCategories: categories });
    } catch (error) {
      console.error("Failed to fetch expense categories:", error);
    }
  },
  addExpenseCategory: async (category) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    try {
      await addDoc(collection(firestore, 'expenseCategories'), { ...category, branchId });
      get().fetchExpenseCategories();
    } catch (error) {
      console.error("Failed to add expense category:", error);
    }
  },
  editExpenseCategory: async (category) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'expenseCategories', category.id), category, { merge: true });
      get().fetchExpenseCategories();
    } catch (error) {
      console.error("Failed to edit expense category:", error);
    }
  },
  deleteExpenseCategory: async (categoryId) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'expenseCategories', categoryId));
      get().fetchExpenseCategories();
    } catch (error) {
      console.error("Failed to delete expense category:", error);
    }
  },
}));

// == EXPENSE STATE ==
type ExpenseState = {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  searchTerm: string;
  dateRange?: DateRange;
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearchTerm: (searchTerm: string) => void;
  setDateRange: (dateRange?: DateRange) => void;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'branchId'>) => Promise<void>;
  editExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
};

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  total: 0,
  page: 1,
  limit: 10,
  searchTerm: '',
  dateRange: undefined,
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,

  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearchTerm: (searchTerm) => set({ searchTerm, page: 1 }),
  setDateRange: (dateRange) => set({ dateRange, page: 1 }),

  fetchExpenses: async () => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isFetching: true });
    try {
      const expensesRef = collection(firestore, 'expenses');
      const { searchTerm, page, limit, dateRange } = get();

      let queryConstraints = [where('branchId', '==', branchId)];
      if (dateRange?.from) {
        queryConstraints.push(where('tanggal', '>=', startOfDay(dateRange.from)));
      }
      if (dateRange?.to) {
        queryConstraints.push(where('tanggal', '<=', endOfDay(dateRange.to)));
      }

      const q = query(expensesRef, ...queryConstraints, orderBy('tanggal', 'desc'));
      const querySnapshot = await getDocs(q);

      const categories = useExpenseCategoryStore.getState().expenseCategories;
      const categoriesMap = new Map(categories.map(c => [c.id, c.nama_kategori]));

      let expenses: Expense[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
            id: doc.id,
            ...data,
            tanggal: (data.tanggal as Timestamp).toDate(),
            nama_kategori: categoriesMap.get(data.kategori_id) || 'N/A'
        } as Expense
      });

      if (searchTerm) {
        expenses = expenses.filter(e => 
          e.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) || 
          e.nama_kategori?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      const total = expenses.length;
      const paginatedExpenses = expenses.slice((page - 1) * limit, page * limit);
      
      set({ expenses: paginatedExpenses, total, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      toast({ variant: 'destructive', title: 'Gagal Mengambil Data', description: 'Gagal mengambil data biaya.' });
      set({ isFetching: false });
    }
  },

  addExpense: async (expense) => {
    const { firestore } = useFirebaseStore.getState();
    const { branchId } = useAuthStore.getState();
    if (!firestore || !branchId) return;

    set({ isSubmitting: true });
    try {
      await addDoc(collection(firestore, 'expenses'), { ...expense, branchId });
      toast({ title: 'Biaya Ditambahkan', description: 'Catatan biaya baru telah disimpan.' });
      get().fetchExpenses();
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menyimpan biaya.' });
    } finally {
      set({ isSubmitting: false });
    }
  },

  editExpense: async (expense) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isSubmitting: true });
    try {
      await setDoc(doc(firestore, 'expenses', expense.id), expense, { merge: true });
      toast({ title: 'Biaya Diperbarui', description: 'Perubahan telah disimpan.' });
      get().fetchExpenses();
    } catch (error) {
      console.error("Failed to edit expense:", error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  deleteExpense: async (expenseId) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;

    set({ isDeleting: true });
    try {
      await deleteDoc(doc(firestore, 'expenses', expenseId));
      toast({ title: 'Biaya Dihapus' });
      get().fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      set({ isDeleting: false });
    }
  },
}));
