import { create } from 'zustand';
import { Branch } from '@/lib/types';

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
    set({ isFetching: true });
    try {
      const response = await fetch('/api/branches');
      const branches = await response.json();
      set({ branches, isFetching: false });
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      set({ isFetching: false });
    }
  },
  addBranch: async (branch) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch),
      });
      const newBranch = await response.json();
      set((state) => ({
        branches: [...state.branches, newBranch],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error("Failed to add branch:", error);
      set({ isSubmitting: false });
    }
  },
  editBranch: async (updatedBranch) => {
    set({ isSubmitting: true });
    try {
      const response = await fetch(`/api/branches/${updatedBranch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBranch),
      });
      const returnedBranch = await response.json();
      set((state) => ({
        branches: state.branches.map((branch) =>
          branch.id === returnedBranch.id ? returnedBranch : branch
        ),
        isSubmitting: false,
      }));
    } catch (error) {
      console.error("Failed to edit branch:", error);
      set({ isSubmitting: false });
    }
  },
  deleteBranch: async (branchId) => {
    set({ isDeleting: true });
    try {
      await fetch(`/api/branches/${branchId}`, { method: 'DELETE' });
      set((state) => ({
        branches: state.branches.filter((branch) => branch.id !== branchId),
        isDeleting: false,
      }));
    } catch (error) {
      console.error("Failed to delete branch:", error);
      set({ isDeleting: false });
    }
  },
  getBranchById: (branchId) => {
    return get().branches.find((branch) => branch.id === branchId);
  },
}));
