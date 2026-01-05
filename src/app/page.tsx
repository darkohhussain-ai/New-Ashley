
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardClient = dynamic(
  () => import('@/components/dashboard/dashboard-client').then((mod) => mod.DashboardClient),
  {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-background text-foreground">
         <header className="bg-card border-b top-0 z-10">
            <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
                <div className="w-1/3"><Skeleton className="h-4 w-48" /></div>
                <div className="flex justify-center w-1/3"><Skeleton className="h-10 w-48" /></div>
                <div className="flex justify-end w-1/3"><Skeleton className="h-8 w-24" /></div>
            </div>
            <div className="relative w-full mx-auto my-4 max-w-6xl rounded-lg overflow-hidden">
                <Skeleton className="h-[150px] w-full" />
            </div>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <div className="mb-8">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(7)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                ))}
            </div>
        </main>
        </div>
    ),
  }
);

export default function Home() {
  return <DashboardClient />;
}

    