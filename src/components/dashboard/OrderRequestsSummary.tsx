'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListOrdered, History, Building } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const destinations = ["Erbil", "Baghdad", "Dohuk", "Diwan"];

export function OrderRequestsSummary() {
  const { t } = useTranslation();
  const { transferItems, settings } = useAppContext();
  const router = useRouter();

  const destinationStats = useMemo(() => {
    const orderRequests = transferItems.filter(item => item.requestedBy && !item.transferId);
    
    return destinations.map(dest => {
        const itemsForDest = orderRequests.filter(item => item.destination === dest);
        const latestRequest = itemsForDest
            .sort((a,b) => parseISO(b.requestDate || b.createdAt).getTime() - parseISO(a.requestDate || a.createdAt).getTime())[0];
        
        const color = 'hsl(var(--chart-5))';

        return {
            destination: dest,
            requestCount: itemsForDest.length,
            lastRequestDate: latestRequest ? (latestRequest.requestDate || latestRequest.createdAt) : null,
            color: color
        };
    });
  }, [transferItems]);
  
  const hasData = useMemo(() => destinationStats.some(d => d.requestCount > 0), [destinationStats]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ListOrdered /> {t('order_requests')}</CardTitle>
        <CardDescription>{t('order_requests_summary_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasData ? destinationStats.map(stat => (
            <Card 
              key={stat.destination} 
              className="p-4 flex flex-col justify-between hover:bg-muted/50 cursor-pointer transition-colors" 
              style={{ borderLeft: `4px solid ${stat.color}`}} 
              onClick={() => router.push(`/transmit/view-requests`)}
            >
                <div>
                    <p className="font-bold text-lg flex items-center gap-2">
                        <Building className="w-5 h-5 text-muted-foreground"/> 
                        {stat.destination}
                    </p>
                    <p className="text-2xl font-bold">{stat.requestCount} <span className="text-sm font-normal text-muted-foreground">{t('requests')}</span></p>
                </div>
                 <div className="text-xs text-muted-foreground mt-2">
                    <p className="flex items-center gap-1.5">
                        <History className="w-3 h-3" />
                        {t('last_request')}: {stat.lastRequestDate ? format(parseISO(stat.lastRequestDate), 'PP') : t('na')}
                    </p>
                </div>
            </Card>
        )) : (
             <div className="md:col-span-2 text-center py-8">
                <p className="text-sm text-muted-foreground">{t('no_open_order_requests')}</p>
             </div>
        )}
      </CardContent>
    </Card>
  );
}
