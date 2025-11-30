'use client';

import React, { useEffect, useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { useFirebaseStore } from '@/store/firebase-store';
import { useAuthInitializer } from '@/store/auth-store';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore, initialize } = useFirebaseStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Initialize the auth listener hook
  useAuthInitializer();

  // Memoize the service objects to prevent unnecessary re-renders of the provider
  const firebaseServices = useMemo(() => {
    return { firebaseApp, auth, firestore };
  }, [firebaseApp, auth, firestore]);

  if (!firebaseServices.firebaseApp) {
    // You can render a global loading spinner here if you want
    return <div>Connecting to services...</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth!}
      firestore={firebaseServices.firestore!}
    >
      {children}
    </FirebaseProvider>
  );
}
