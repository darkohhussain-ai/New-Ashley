
"use client"

import Dashboard from "@/app/dashboard/page"
import { useAppContext } from "@/context/app-provider";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
    const { employees } = useAppContext();

    // The context might not be hydrated on the very first render,
    // so we can show a loading state.
    if (!employees) {
        return (
            <div className="min-h-screen bg-background p-8">
                <Skeleton className="h-20 mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    return <Dashboard />
}
