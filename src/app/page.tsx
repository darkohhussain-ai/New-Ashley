
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardClient } from '@/app/dashboard/dashboard-client';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      setIsAuth(true);
    } else {
      setIsAuth(false);
      router.replace('/login');
    }
  }, [router]);

  if (isAuth === true) {
    return <DashboardClient />;
  }
  
  // Render a loader while checking or redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
