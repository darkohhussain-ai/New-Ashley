
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Truck, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type Transfer = {
  id: string;
  transferDate: Timestamp;
  cargoName: string;
  destinationCity: string;
  driverName: string;
  warehouseManagerName: string;
  itemIds: string[];
};

export default function TransferArchivePage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const transfersRef = useMemoFirebase(() => (firestore && user ? collection(firestore, 'transfers') : null), [firestore, user]);
  const { data: transfers, isLoading } = useCollection<Transfer>(transfersRef);

  const sortedTransfers = useMemo(() => {
    if (!transfers) return [];
    return [...transfers].sort((a, b) => b.transferDate.toDate().getTime() - a.transferDate.toDate().getTime());
  }, [transfers]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/transmit">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">View Transfers</h1>
      </header>
      <main>
        {isLoading || isUserLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : sortedTransfers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTransfers.map(transfer => (
                <Card key={transfer.id} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                    <CardHeader>
                    <CardTitle className="text-lg leading-tight">{transfer.cargoName}</CardTitle>
                    <CardDescription>To: {transfer.destinationCity}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" /> {format(transfer.transferDate.toDate(), 'PPP')}</p>
                    <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Driver: {transfer.driverName}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Manager: {transfer.warehouseManagerName}</p>
                    </CardContent>
                    <CardContent className="flex justify-between items-center">
                        <p className="font-bold text-sm text-primary">{transfer.itemIds.length} items</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/transmit/archive/${transfer.id}`}>
                                <Eye className="mr-2 h-4 w-4"/> View
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Archived Transfers</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first transfer slip to see it here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
