'use client';

import { createContext, useEffect, useMemo } from 'react';
import { getFirebase, type FirebaseServices } from './index';
import { set } from 'idb-keyval';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

export const FirebaseContext = createContext<FirebaseServices | null>(null);

function AuthHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { auth } = getFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
        // Not handling unauthenticated redirects for now
        // if (!isLoginPage) {
        //   router.push('/login');
        // }
      }
    });

    return () => unsubscribe();
  }, [auth, pathname, router]);

  return null; // This component does not render anything
}


export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { app, auth, db, storage } = getFirebase();
  
  return (
    <FirebaseContext.Provider value={{ app, auth, db, storage }}>
      <AuthHandler />
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
