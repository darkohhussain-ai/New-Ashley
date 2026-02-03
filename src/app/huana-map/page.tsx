
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

const Section = ({ id, code, items, onClick, isHighlighted }: { id: string, code: string; items: Item[]; onClick: () => void, isHighlighted?: boolean }) => {
    const {t} = useTranslation();
    const itemCount = items.length;
    const isOccupied = itemCount > 0;
    
    return (
        <button 
            id={id}
            title={`${code}: ${itemCount} ${t('items_lowercase')}`}
            onClick={onClick}
            className={cn(
                "relative w-full h-12 rounded-lg border-2 transition-all group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary",
                isOccupied 
                    ? 'bg-primary/10 border-primary/50 text-primary-foreground' 
                    : 'bg-background/30 border-border hover:border-primary/50',
                isHighlighted && "ring-2 border-primary"
            )}
        >
            <span className="font-mono font-bold text-sm text-foreground group-hover:text-primary">{code}</span>
            {isOccupied && <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />}
        </button>
    );
};

const WarehouseDisplay = ({ name, floors, onSectionClick, itemsByLocationId, highlightId, colorClass }: { name: string; floors: { floor1: StorageLocation[], floor2: StorageLocation[] }, onSectionClick: (loc: StorageLocation) => void, itemsByLocationId: Map<string, Item[]>, highlightId: string, colorClass: string }) => {
    const {t} = useTranslation();
    
    const renderSections = (sections: StorageLocation[]) => {
        const getSection = (num: number) => sections.find(s => s.name.endsWith(`-${num}`));
        
        const sectionGrid = [
            [8, 7, 6, 5],
            [1, 2, 3, 4]
        ];

        return (
            <div className="grid grid-cols-4 gap-1">
                {sectionGrid.flat().map(num => {
                    const section = getSection(num);
                    if (!section) return <div key={num} className="h-12 w-full rounded-lg bg-muted/30" />;
                    return <Section key={section.id} id={section.id} code={section.name.split('-').pop()!} items={itemsByLocationId.get(section.id) || []} onClick={() => onSectionClick(section)} isHighlighted={highlightId === section.id} />;
                })}
            </div>
        );
    };

    return (
        <div className={cn("p-3 rounded-xl border-2 space-y-2", colorClass)}>
            <h3 className="text-center font-bold text-lg">{name}</h3>
            <div className="space-y-3">
                <div>
                    <p className="text-xs text-center text-muted-foreground mb-1">{t('floor')} 1</p>
                    {renderSections(floors.floor1)}
                </div>
                <div>
                    <p className="text-xs text-center text-muted-foreground mb-1">{t('floor')} 2</p>
                    {renderSections(floors.floor2)}
                </div>
            </div>
        </div>
    );
};

export default function HuanaMapPage() {
  const { t } = useTranslation();
  const { locations, items: allItems } = useAppContext();
  const [highlightId, setHighlightId] = useState('');

  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [itemsInLocation, setItemsInLocation] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const huanaLocations = useMemo(() => locations.filter(l => l.warehouseType === 'Huana'), [locations]);

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
  }, [huanaLocations]);


  const handleSectionClick = (location: StorageLocation) => {
    setSelectedLocation(location);
    setIsDialogOpen(true);
    const foundItems = allItems.filter(item => item.locationId === location.id);
    setItemsInLocation(foundItems);
  };

  const { hWarehouses, kWarehouse } = useMemo(() => {
    const createWarehouse = () => ({
        floor1: [] as StorageLocation[],
        floor2: [] as StorageLocation[],
    });

    const hWarehouses: Record<string, {floor1: StorageLocation[], floor2: StorageLocation[]}> = {
        h1: createWarehouse(),
        h2: createWarehouse(),
        h3: createWarehouse(),
    };
    const kWarehouse = { k1: createWarehouse() };

    if (!huanaLocations) return { hWarehouses, kWarehouse };

    for (const loc of huanaLocations) {
        if (loc.name.startsWith('H-1')) {
            loc.name.includes('-1-') ? hWarehouses.h1.floor1.push(loc) : hWarehouses.h1.floor2.push(loc);
        } else if (loc.name.startsWith('H-2')) {
            loc.name.includes('-1-') ? hWarehouses.h2.floor1.push(loc) : hWarehouses.h2.floor2.push(loc);
        } else if (loc.name.startsWith('H-3')) {
            loc.name.includes('-1-') ? hWarehouses.h3.floor1.push(loc) : hWarehouses.h3.floor2.push(loc);
        } else if (loc.name.startsWith('K-1')) {
            loc.name.includes('-1-') ? kWarehouse.k1.floor1.push(loc) : kWarehouse.k1.floor2.push(loc);
        }
    }
    return { hWarehouses, kWarehouse };
  }, [huanaLocations]);
  
  const itemsByLocationId = useMemo(() => {
    if (!allItems) return new Map<string, Item[]>();
    return allItems.reduce((acc, item) => {
        if(item.locationId) {
            if(!acc.has(item.locationId)) acc.set(item.locationId, []);
            acc.get(item.locationId)!.push(item);
        }
        return acc;
    }, new Map<string, Item[]>());
  }, [allItems])

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="min-h-screen bg-muted/40 text-foreground p-4 md:p-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/items">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_dashboard')}</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl">{t('huana_warehouse_map')}</h1>
        </header>
        <main className="relative max-w-7xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <Card className="bg-blue-200/30 dark:bg-blue-900/30 border-blue-400/50 h-24 flex items-center justify-center">
                        <CardTitle className="text-blue-800 dark:text-blue-200">D3</CardTitle>
                    </Card>
                    <WarehouseDisplay name="K1" floors={kWarehouse.k1} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} colorClass="bg-[hsl(var(--huana-k-bg))] border-pink-400/50" />
                </div>

                {/* Middle Column */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <Card className="bg-blue-200/30 dark:bg-blue-900/30 border-blue-400/50 flex-grow min-h-[300px] flex items-center justify-center">
                        <CardTitle className="text-blue-800 dark:text-blue-200">D1</CardTitle>
                    </Card>
                     <Card className="bg-blue-200/30 dark:bg-blue-900/30 border-blue-400/50 min-h-[150px] flex items-center justify-center">
                        <CardTitle className="text-blue-800 dark:text-blue-200">D2</CardTitle>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <WarehouseDisplay name="H3" floors={hWarehouses.h3} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} colorClass="bg-[hsl(var(--huana-h3-bg))] border-cyan-400/50" />
                    <WarehouseDisplay name="H2" floors={hWarehouses.h2} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} colorClass="bg-[hsl(var(--huana-h2-bg))] border-green-400/50" />
                    <WarehouseDisplay name="H1" floors={hWarehouses.h1} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} colorClass="bg-[hsl(var(--huana-h1-bg))] border-yellow-400/50" />
                </div>
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
