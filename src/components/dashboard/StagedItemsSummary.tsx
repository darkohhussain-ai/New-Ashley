'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, Calendar, Building } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const destinations = ["Erbil", "Baghdad", "Dohuk", "Diwan"];

export function StagedItemsSummary() {
  const { t } = useTranslation();
  const { transferItems, transfers, settings } = useAppContext();
  const router = useRouter();

  const destinationStats = useMemo(() => {
    const staged = transferItems.filter(item => !item.transferId);
    
    return destinations.map(dest => {
        const itemsForDest = staged.filter(item => item.destination === dest);
        const lastTransfer = transfers
            .filter(t => t.destinationCity === dest && t.transferDate && !isNaN(parseISO(t.transferDate).getTime()))
            .sort((a,b) => parseISO(b.transferDate).getTime() - parseISO(a.transferDate).getTime())[0];
        
        const color = settings.pdfSettings.invoice.branchColors?.[dest as keyof typeof settings.pdfSettings.invoice.branchColors] || '#cccccc';

        return {
            destination: dest,
            stagedItemCount: itemsForDest.length,
            lastTransferDate: lastTransfer ? lastTransfer.transferDate : null,
            color: color
        };
    });
  }, [transferItems, transfers, settings.pdfSettings.invoice.branchColors]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Truck /> {t('staged_items_summary')}</CardTitle>
        <CardDescription>{t('staged_items_summary_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {destinationStats.map(stat => (
            <Card 
              key={stat.destination} 
              className="p-4 flex flex-col justify-between hover:bg-muted/50 cursor-pointer transition-colors" 
              style={{ borderLeft: `4px solid ${stat.color}`}} 
              onClick={() => router.push(`/transmit/staged?destination=${stat.destination}`)}
            >
                <div>
                    <p className="font-bold text-lg flex items-center gap-2">
                        <Building className="w-5 h-5 text-muted-foreground"/> 
                        {stat.destination}
                    </p>
                    <p className="text-2xl font-bold">{stat.stagedItemCount} <span className="text-sm font-normal text-muted-foreground">{t('items_staged')}</span></p>
                </div>
                 <div className="text-xs text-muted-foreground mt-2">
                    <p className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {t('last_transfer')}: {stat.lastTransferDate ? format(parseISO(stat.lastTransferDate), 'PP') : t('na')}
                    </p>
                </div>
            </Card>
        ))}
      </CardContent>
    </Card>
  );
}
