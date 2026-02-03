
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-provider';
import type { Item, StorageLocation } from '@/lib/types';
import { useTranslation } from '@/hooks/use-translation';


const Shelf = ({ loc, items, onClick, isHighlighted }: { loc: StorageLocation, items: Item[], onClick: (loc: StorageLocation) => void, isHighlighted: boolean }) => {
    const itemCount = items.length;
    const isOccupied = itemCount > 0;
    const locationCode = loc.name.split('-').pop();
    
    return (
        <div 
            id={loc.id}
            className="flex-shrink-0"
            title={`${loc.name}: ${itemCount} items`}
        >
            <button 
                onClick={() => onClick(loc)}
                className={cn(
                    "relative w-12 h-16 bg-gray-300/70 dark:bg-gray-700/70 border border-gray-400/70 dark:border-gray-600/70 rounded-sm flex items-end justify-center pb-1 transition-all group focus:outline-none focus:ring-2 focus:ring-primary focus:z-10",
                    isOccupied && "bg-location-occupied-bg/70 border-location-occupied-border/70",
                    isHighlighted && "ring-2 ring-primary z-10"
                )}
            >
                <div className={cn(
                    "absolute -top-3 left-0 w-full h-3 bg-gray-200/70 dark:bg-gray-800/70 border-t border-x border-gray-400/70 dark:border-gray-500/70 rounded-t-sm transform -skew-x-[45deg]",
                    isOccupied && "bg-location-occupied-bg border-location-occupied-border",
                    "group-hover:bg-primary/20 group-hover:border-primary"
                )} />

                <div className={cn(
                     "absolute top-0 right-0 w-3 h-full bg-gray-200/70 dark:bg-gray-800/70 border-y border-r border-gray-400/70 dark:border-gray-500/70 rounded-r-sm transform -skew-y-[45deg] origin-top-right",
                     isOccupied && "bg-location-occupied-bg/50 border-location-occupied-border/50",
                     "group-hover:bg-primary/10 group-hover:border-primary/50"
                 )} />

                <span className="relative text-xs font-mono text-muted-foreground group-hover:text-primary">{locationCode}</span>
                {isOccupied && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary/80" />}
            </button>
        </div>
    );
};

export default function AshleyMapPage() {
  const { locations, items: allItems } = useAppContext();
  const [highlightId, setHighlightId] = useState('');
  const { t } = useTranslation();

  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [itemsInLocation, setItemsInLocation] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const ashleyLocations = useMemo(() => locations.filter(l => l.warehouseType === 'Ashley'), [locations]);

  useEffect(() => {
    if (locations && allItems) {
      setIsLoading(false);
    }
  }, [locations, allItems]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const hash = window.location.hash.substring(1);
        setHighlightId(hash);
        if (hash) {
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
  }, [ashleyLocations]);

  const handleSectionClick = (location: StorageLocation) => {
    setSelectedLocation(location);
    setIsDialogOpen(true);
    const foundItems = allItems.filter(item => item.locationId === location.id);
    setItemsInLocation(foundItems);
  };

  const { floor4, floor3area1Units, floor3office } = useMemo(() => {
    if (!ashleyLocations) return { floor4: [], floor3area1Units: {}, floor3office: [] };
    
    const floor4 = ashleyLocations
      .filter(l => l.name.startsWith('A-4-'))
      .sort((a,b) => {
        const numA = parseInt(a.name.split('-')[2]);
        const numB = parseInt(b.name.split('-')[2]);
        return numA - numB;
      });
    
    const floor3area1Units: Record<string, StorageLocation[]> = {};
    ashleyLocations.filter(l => l.name.startsWith('A-3-1-')).forEach(loc => {
      const parts = loc.name.split('-');
      if (parts.length !== 5) return;
      const unit = parts[3];
      if (!floor3area1Units[unit]) floor3area1Units[unit] = [];
      floor3area1Units[unit].push(loc);
    });

    Object.values(floor3area1Units).forEach(unitSections => 
      unitSections.sort((a,b) => {
          const numA = parseInt(a.name.split('-')[4]);
          const numB = parseInt(b.name.split('-')[4]);
          return numA - numB;
      })
    );
    
    const floor3office = ashleyLocations
      .filter(l => l.name.startsWith('A-3-O-'))
      .sort((a,b) => a.name.localeCompare(b.name));
    
    return { floor4, floor3area1Units, floor3office };
  }, [ashleyLocations]);

  const itemsByLocationId = useMemo(() => {
    if (!allItems) return new Map<string, Item[]>();
    return allItems.reduce((acc, item) => {
        if(item.locationId) {
            if(!acc.has(item.locationId)) acc.set(item.locationId, []);
            acc.get(item.locationId)!.push(item);
        }
        return acc;
    }, new Map<string, Item[]>());
  }, [allItems]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/items">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_dashboard')}</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl">{t('ashley_warehouse_map')}</h1>
        </header>
        <main className="space-y-8">
          {isLoading ? (
             <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                    </Card>
                ))}
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('floor_4')}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 flex justify-center bg-gray-100 dark:bg-gray-900/30 rounded-xl overflow-x-auto">
                    <div className="flex flex-col gap-12">
                        <div className="flex flex-nowrap gap-2">
                             {floor4.slice(0, 8).map(loc => (
                                <Shelf key={loc.id} loc={loc} items={itemsByLocationId.get(loc.id) || []} onClick={handleSectionClick} isHighlighted={highlightId === loc.id} />
                            ))}
                        </div>
                        <div className="flex flex-nowrap gap-2">
                             {floor4.slice(8, 16).map(loc => (
                                <Shelf key={loc.id} loc={loc} items={itemsByLocationId.get(loc.id) || []} onClick={handleSectionClick} isHighlighted={highlightId === loc.id} />
                            ))}
                        </div>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('floor_3')}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 flex flex-wrap gap-12 justify-center items-start bg-gray-100 dark:bg-gray-900/30 rounded-xl">
                    <div className="space-y-6">
                        <CardTitle className="text-center">{t('area_1')}</CardTitle>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
                            {Object.keys(floor3area1Units).sort((a,b) => parseInt(a) - parseInt(b)).map(unitKey => (
                                <div key={unitKey} className="flex flex-col items-center gap-2">
                                    <CardDescription>{t('unit')} {unitKey}</CardDescription>
                                    <div className="grid grid-cols-2 gap-2">
                                        {floor3area1Units[unitKey].map(loc => (
                                            <Shelf key={loc.id} loc={loc} items={itemsByLocationId.get(loc.id) || []} onClick={handleSectionClick} isHighlighted={highlightId === loc.id} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6 pt-2">
                         <CardTitle className="text-center">{t('area_2_office')}</CardTitle>
                         <div className="grid grid-cols-3 gap-2">
                            {floor3office.map(loc => (
                                <Shelf key={loc.id} loc={loc} items={itemsByLocationId.get(loc.id) || []} onClick={handleSectionClick} isHighlighted={highlightId === loc.id} />
                            ))}
                        </div>
                    </div>
                </CardContent>
              </Card>
            </>
          )}
           {(!isLoading && ashleyLocations.length === 0) && (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg">{t('no_ashley_locations_found')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t('no_ashley_locations_found_desc')}</p>
                <Button asChild className="mt-4"><Link href="/locations">{t('manage_locations')}</Link></Button>
            </div>
           )}
        </main>
      </div>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('items_in_location', {locationName: selectedLocation?.name})}</DialogTitle>
          <CardDescription>{t('items_in_location_desc')}</CardDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {itemsInLocation.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('model')}</TableHead>
                        <TableHead className="text-right">{t('quantity')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {itemsInLocation.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>{item.model}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-8">{t('no_items_in_this_location')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
    