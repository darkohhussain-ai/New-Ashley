
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ListOrdered, Building, PackageSearch } from 'lucide-react';
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
      <CardHeader className="bg-muted/30 py-3 px-4">
        <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-primary" />
            {t('order_requests')}
        </CardTitle>
        <CardDescription className="text-[11px]">{t('order_requests_summary_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {destinationStats.filter(s => s.requestCount > 0).map(stat => (
                    <div 
                      key={stat.destination} 
                      className="p-3 flex flex-col justify-between hover:bg-muted/50 cursor-pointer transition-all rounded-xl border border-primary/5" 
                      onClick={() => router.push(`/transmit/view-requests`)}
                    >
                        <div>
                            <p className="font-bold text-xs flex items-center gap-1.5 mb-0.5">
                                <Building className="w-3 h-3 text-muted-foreground"/> 
                                {stat.destination}
                            </p>
                            <p className="text-xl font-black">{stat.requestCount} <span className="text-[9px] font-bold text-muted-foreground uppercase">{t('requests')}</span></p>
                        </div>
                         <div className="text-[9px] font-black text-muted-foreground mt-2 opacity-60 uppercase">
                            {t('last_request')}: {stat.lastRequestDate ? format(parseISO(stat.lastRequestDate), 'PP') : t('na')}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-center py-10 space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center opacity-50">
                    <PackageSearch className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground">{t('no_open_order_requests')}</p>
             </div>
        )}
      </CardContent>
    </Card>
  );
}
