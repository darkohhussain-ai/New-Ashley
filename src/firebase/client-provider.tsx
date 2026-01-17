'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

type FirebaseServices = Awaited<ReturnType<typeof initializeFirebase>>;

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    const init = async () => {
      const services = await initializeFirebase();
      setFirebaseServices(services);
    };
    init();
  }, []);

  if (!firebaseServices) {
    // This is a simplified, context-free splash screen to show while Firebase initializes.
    // It prevents the "useAppContext must be used within an AppProvider" error.
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
          <div className="animate-pulse">
            <div className="relative w-48 h-16">
              <div className="w-full h-full bg-muted rounded-md" />
            </div>
          </div>
        </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
