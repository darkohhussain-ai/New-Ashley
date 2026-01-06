
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardClient = dynamic(
  () => import('@/components/dashboard/dashboard-client').then((mod) => mod.DashboardClient),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  }
);

function DashboardSkeleton() {
    return (
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
    );
}


export default function Home() {
  return <DashboardClient />;
}
