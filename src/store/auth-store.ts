
"use client";

import { create } from 'zustand';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebaseStore } from './firebase-store';
import { UserProfile } from '@/lib/types';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  branchId: string | null;
  role: 'admin' | 'user' | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchUserProfile: (user: User) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  branchId: null,
  role: null,
  isLoading: true,
  
  setUser: (user) => {
    set({ user, isLoading: true });
    if (user) {
      get().fetchUserProfile(user);
    } else {
      get().clearAuth();
    }
  },

  fetchUserProfile: async (user) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) {
      set({ isLoading: false });
      return;
    }

    // This is a simplification. In a real multi-branch app, you might need
    // to query which branch a user belongs to if it's not in their auth claims.
    // Here we'll have to check common locations. Let's assume we can derive it.
    // For now, we will have to check all branches. This is inefficient but necessary
    // without custom claims.

    const branchesResponse = await fetch('/api/branches');
    const branches = await branchesResponse.json();

    let foundProfile: UserProfile | null = null;
    let foundBranchId: string | null = null;

    for (const branch of branches) {
        const userDocRef = doc(firestore, `branches/${branch.id}/users`, user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            foundProfile = userDocSnap.data() as UserProfile;
            foundBranchId = branch.id;
            break; 
        }
    }

    if (foundProfile && foundBranchId) {
        set({
            userProfile: foundProfile,
            branchId: foundBranchId,
            role: foundProfile.role,
            isLoading: false,
        });
    } else {
        console.warn(`User profile not found for UID: ${user.uid} in any branch.`);
        get().clearAuth();
    }
  },
  
  clearAuth: () => {
    set({
      user: null,
      userProfile: null,
      branchId: null,
      role: null,
      isLoading: false,
    });
  },
}));
