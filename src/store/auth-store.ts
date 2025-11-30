
"use client";

import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useFirebaseStore } from './firebase-store';
import { UserProfile } from '@/lib/types';
import { useEffect } from 'react';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  branchId: string | null;
  role: 'admin' | 'user' | null;
  isLoading: boolean;
  initializeAuthListener: () => () => void; // Returns the unsubscribe function
  fetchUserProfile: (user: User) => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  branchId: null,
  role: null,
  isLoading: true,
  
  initializeAuthListener: () => {
    const { auth } = useFirebaseStore.getState();
    if (!auth) {
        console.error("Auth service not initialized in FirebaseStore.");
        set({ isLoading: false });
        return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        set({ user });
        get().fetchUserProfile(user);
      } else {
        get().clearAuth();
      }
    });
    
    return unsubscribe;
  },

  fetchUserProfile: async (user) => {
    const { firestore } = useFirebaseStore.getState();
    if (!firestore) {
      console.error("Firestore not initialized.");
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    
    try {
        const branchesSnapshot = await getDocs(collection(firestore, 'branches'));
        let foundProfile: UserProfile | null = null;

        for (const branchDoc of branchesSnapshot.docs) {
            const userDocRef = doc(firestore, `branches/${branchDoc.id}/users`, user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                foundProfile = userDocSnap.data() as UserProfile;
                break; 
            }
        }

        if (foundProfile) {
            set({
                userProfile: foundProfile,
                branchId: foundProfile.branchId,
                role: foundProfile.role,
                isLoading: false,
            });
        } else {
             // This case is important: user is authenticated but has no profile document.
             // This might happen during registration race conditions.
             // We treat them as a non-profiled user.
            console.warn(`User profile not found for UID: ${user.uid}. The user is authenticated but has no profile document.`);
            set({
                userProfile: null,
                branchId: null,
                role: null,
                isLoading: false,
            });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        get().clearAuth(); // Clear on error
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

// A hook to initialize the auth listener once in the app's lifecycle
export const useAuthInitializer = () => {
    const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);

    useEffect(() => {
        const unsubscribe = initializeAuthListener();
        return () => unsubscribe(); // Cleanup on unmount
    }, [initializeAuthListener]);
}
