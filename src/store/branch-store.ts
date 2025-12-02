import { create } from 'zustand';
import { Branch } from '@/lib/types';
import { useFirebaseStore } from './firebase-store';
import { collection, getDocs, doc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';

type BranchState = {
  branches: Branch[];
  isFetching: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  fetchBranches: () => Promise<void>;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<void>;
  editBranch: (branch: Branch) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  getBranchById: (branchId: string) => Branch | undefined;
};

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  fetchBranches: async () => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    set({ isFetching: true });
    try {
      const querySnapshot = await getDocs(collection(firestore, 'branches'));
      const branches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      set({ branches, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      set({ isFetching: false });
    }
  },
  addBranch: async (branch) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    set({ isSubmitting: true });
    const branchesRef = collection(firestore, 'branches');
    try {
        const docRef = await addDoc(branchesRef, branch);
        // Optimistically update the state
        set((state) => ({
            branches: [...state.branches, { id: docRef.id, ...branch }],
        }));
    } catch(error) {
         console.error("Failed to add branch:", error);
    } finally {
        set({ isSubmitting: false });
    }
  },
  editBranch: async (updatedBranch) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    set({ isSubmitting: true });
    const branchRef = doc(firestore, "branches", updatedBranch.id);
    try {
        await setDoc(branchRef, updatedBranch, { merge: true });
        // Optimistically update the state so UI reflects changes immediately
        set((state) => ({
            branches: state.branches.map((branch) =>
            branch.id === updatedBranch.id ? updatedBranch : branch
            ),
        }));
    } catch (error) {
        console.error("Failed to edit branch:", error);
    } finally {
        set({ isSubmitting: false });
    }
  },
  deleteBranch: async (branchId) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) return;
    set({ isDeleting: true });
    const branchRef = doc(firestore, "branches", branchId);
    try {
        await deleteDoc(branchRef);
        // Optimistically update the state
        set((state) => ({
            branches: state.branches.filter((branch) => branch.id !== branchId),
        }));
    } catch (error) {
         console.error("Failed to delete branch:", error);
    } finally {
        set({ isDeleting: false });
    }
  },
  getBranchById: (branchId) => {
    return get().branches.find((branch) => branch.id === branchId);
  },
}));
