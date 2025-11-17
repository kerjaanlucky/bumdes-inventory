import { create } from 'zustand';
import { branches as initialBranches } from '@/lib/data';
import { Branch } from '@/lib/types';

type BranchState = {
  branches: Branch[];
  addBranch: (branch: Omit<Branch, 'id' | 'manager'>) => void;
  editBranch: (branch: Branch) => void;
  deleteBranch: (branchId: string) => void;
  getBranchById: (branchId: string) => Branch | undefined;
};

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: initialBranches,
  addBranch: (branch) => {
    const newBranch: Branch = {
      ...branch,
      id: `BRN${String(get().branches.length + 1).padStart(2, '0')}`,
      manager: 'N/A',
    };
    set((state) => ({
      branches: [...state.branches, newBranch],
    }));
  },
  editBranch: (updatedBranch) => {
    set((state) => ({
      branches: state.branches.map((branch) =>
        branch.id === updatedBranch.id ? { ...updatedBranch, manager: branch.manager } : branch
      ),
    }));
  },
  deleteBranch: (branchId) => {
    set((state) => ({
      branches: state.branches.filter((branch) => branch.id !== branchId),
    }));
  },
  getBranchById: (branchId: string) => {
    return get().branches.find((branch) => branch.id === branchId);
  }
}));
