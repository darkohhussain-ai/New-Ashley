'use client';

import { createContext, useEffect, useMemo, useState } from 'react';
import { getFirebase, type FirebaseServices } from './index';
import { set } from 'idb-keyval';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export const FirebaseContext = createContext<FirebaseServices | null>(null);

function usePrevious<T>(value: T) {
  const ref = React.useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { app, auth, db, storage } = getFirebase();
  const router = useRouter();
  const pathname = usePathname();

  onAuthStateChanged(auth, async (user) => {
    const isLoginPage = pathname === '/login';

    if (user) {
      const token = await user.getIdTokenResult();
      await set('user', {
        ...user,
        claims: token.claims,
      });

      if (isLoginPage) {
        router.push('/');
      }
    } else {
      if (!isLoginPage) {
        // TODO: Figure out how to handle this better
        // router.push('/login');
      }
    }
  });

  return (
    <FirebaseContext.Provider value={{ app, auth, db, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const services = useMemo(() => getFirebase(), []);

  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
}
