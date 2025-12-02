'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { onAuthStateChanged } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      if (!user) {
        // If no user is signed in, initiate anonymous sign-in
        initiateAnonymousSignIn(firebaseServices.auth);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
