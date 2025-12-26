'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeeDetailRedirect() {
  const router = useRouter();

  useEffect(() => {
    // This page is no longer used. The functionality has been merged into /employees.
    // We redirect users back to the main employees page to ensure they use the new layout.
    router.replace('/employees');
  }, [router]);

  // Render a simple loading state while redirecting
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
