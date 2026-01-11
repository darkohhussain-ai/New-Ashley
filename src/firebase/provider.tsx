
'use client';

import { createContext } from 'react';

// This file is part of the Firebase integration.
// Since we are reverting to an offline-first approach, this provider is no longer used
// but is kept for potential future re-integration.

// Define a minimal context to avoid errors if imported elsewhere.
export const FirebaseContext = createContext<null>(null);


export function FirebaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
