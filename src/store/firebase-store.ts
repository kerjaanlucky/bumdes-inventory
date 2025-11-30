
import { create } from 'zustand';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

interface FirebaseState {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  initialize: () => void;
}

export const useFirebaseStore = create<FirebaseState>((set) => ({
  firebaseApp: null,
  auth: null,
  firestore: null,
  initialize: () => {
    if (typeof window !== 'undefined') {
      const { firebaseApp, auth, firestore } = initializeFirebase();
      set({ firebaseApp, auth, firestore });
    }
  },
}));
