
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page is deprecated. We redirect to the new archive page.
export default function ExpensesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/expenses/archive');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
