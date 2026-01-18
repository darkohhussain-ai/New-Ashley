
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Truck, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';


export default function TransferArchivePage() {
  const { transfers } = useAppContext();
  const { t } = useTranslation();
  const isLoading = !transfers;

  const sortedTransfers = useMemo(() => {
    if (!transfers) return [];
    return [...transfers].sort((a, b) => new Date(b.transferDate).getTime() - new Date(a.transferDate).getTime());
  }, [transfers]);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="p-4 md:p-8 flex items-center gap-4 border-b">
        <Button variant="outline" size="icon" asChild>
          <Link href="/transmit">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">{t('view_transfers')}</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {isLoading ? (
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
                    <CardDescription>{t('to_destination')}: {transfer.destinationCity}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" /> {format(parseISO(transfer.transferDate), 'PPP')}</p>
                    <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> {t('driver')}: {transfer.driverName}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {t('manager')}: {transfer.warehouseManagerName}</p>
                    </CardContent>
                    <CardContent className="flex justify-between items-center">
                        <p className="font-bold text-sm text-primary">{transfer.itemIds.length} {t('items_lowercase')}</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/transmit/archive/${transfer.id}`}>
                                <Eye className="mr-2 h-4 w-4"/> {t('view')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_archived_transfers')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('no_archived_transfers_desc')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
