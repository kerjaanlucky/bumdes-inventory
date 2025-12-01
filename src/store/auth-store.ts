
"use client";

import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebaseStore } from './firebase-store';
import { UserProfile } from '@/lib/types';
import { useEffect } from 'react';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  branchId: string | null;
  role: 'admin' | 'user' | null;
  isLoading: boolean;
  initializeAuthListener: () => () => void;
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
        set({ user, isLoading: true }); // Set user and start loading profile
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
    
    try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userProfile = userDocSnap.data() as UserProfile;
            set({
                userProfile: userProfile,
                branchId: userProfile.branchId,
                role: userProfile.role,
                isLoading: false,
            });
        } else {
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
