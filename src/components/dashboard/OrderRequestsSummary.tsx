
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListOrdered, History, Building, PackageSearch } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const destinations = ["Erbil", "Baghdad", "Dohuk", "Diwan"];

export function OrderRequestsSummary() {
  const { t } = useTranslation();
  const { orderRequests } = useAppContext();
  const router = useRouter();

  const destinationStats = useMemo(() => {
    const pendingRequests = orderRequests.filter(item => item.status === 'Pending');
    
    return destinations.map(dest => {
        const itemsForDest = pendingRequests.filter(item => item.destination === dest);
        const latestRequest = itemsForDest
            .sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())[0];
        
        return {
            destination: dest,
            requestCount: itemsForDest.length,
            lastRequestDate: latestRequest ? (latestRequest.requestDate || latestRequest.createdAt) : null,
        };
    });
  }, [orderRequests]);
  
  const hasData = useMemo(() => destinationStats.some(d => d.requestCount > 0), [destinationStats]);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            {t('order_requests')}
        </CardTitle>
        <CardDescription>{t('order_requests_summary_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destinationStats.filter(s => s.requestCount > 0).map(stat => (
                    <div 
                      key={stat.destination} 
                      className="p-4 flex flex-col justify-between hover:bg-muted/50 cursor-pointer transition-all rounded-xl border border-primary/10" 
                      onClick={() => router.push(`/transmit/view-requests`)}
                    >
                        <div>
                            <p className="font-bold text-md flex items-center gap-2 mb-1">
                                <Building className="w-4 h-4 text-muted-foreground"/> 
                                {stat.destination}
                            </p>
                            <p className="text-2xl font-bold">{stat.requestCount} <span className="text-xs font-normal text-muted-foreground uppercase">{t('requests')}</span></p>
                        </div>
                         <div className="text-[10px] font-bold text-muted-foreground mt-2 opacity-60">
                            {t('last_request')}: {stat.lastRequestDate ? format(parseISO(stat.lastRequestDate), 'PP') : t('na')}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center opacity-50">
                    <PackageSearch className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{t('no_open_order_requests')}</p>
             </div>
        )}
      </CardContent>
    </Card>
  );
}
