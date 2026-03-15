
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, MapPin } from 'lucide-react';
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
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl">{t('staged_items_summary')}</CardTitle>
        <CardDescription>{t('staged_items_summary_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {destinationStats.map(stat => (
                <div 
                  key={stat.destination} 
                  className="p-4 flex flex-col justify-between hover:bg-muted/50 cursor-pointer transition-all rounded-xl border-2 hover:shadow-sm" 
                  style={{ borderColor: stat.color + '40'}} 
                  onClick={() => router.push(`/transmit/staged?destination=${stat.destination}`)}
                >
                    <div className="space-y-1">
                        <p className="font-bold text-lg flex items-center gap-2">
                            <MapPin className="w-4 h-4" style={{ color: stat.color }} />
                            {stat.destination}
                        </p>
                        <p className="text-2xl font-black">
                            {stat.stagedItemCount} 
                            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-2">{t('items_lowercase')}</span>
                        </p>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-4 pt-2 border-t uppercase font-bold tracking-tighter opacity-60">
                        {t('last_transfer')}: {stat.lastTransferDate ? format(parseISO(stat.lastTransferDate), 'PP') : t('na')}
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
