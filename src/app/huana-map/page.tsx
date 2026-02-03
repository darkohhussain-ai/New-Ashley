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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const Section = ({ id, code, items, onClick, isHighlighted }: { id: string, code: string; items: Item[]; onClick: () => void, isHighlighted?: boolean }) => {
  const itemCount = items.length;
  return (
    <Button
      id={id}
      variant="outline"
      className={cn(`h-12 w-12 flex flex-col items-center justify-center p-1 border-2 transition-all duration-200 text-[10px]`,
        itemCount > 0 ? 'border-location-occupied-border bg-location-occupied-bg hover:bg-location-occupied-bg/80' : 'bg-white/80 dark:bg-black/30 hover:border-muted-foreground/50',
        isHighlighted && 'ring-2 ring-offset-2 ring-primary')}
      onClick={onClick}
    >
      <span className="font-mono">{code}</span>
      {itemCount > 0 && (
        <span className="text-[10px] text-primary flex items-center gap-1 mt-1">
          <Box className="w-2.5 h-2.5" />
          {itemCount}
        </span>
      )}
    </Button>
  );
};

const WarehouseCard = ({ name, floors, onSectionClick, itemsByLocationId, highlightId }: { name: string; floors: { floor1: StorageLocation[], floor2: StorageLocation[] }, onSectionClick: (loc: StorageLocation) => void, itemsByLocationId: Map<string, Item[]>, highlightId: string }) => {
    const {t} = useTranslation();

    const renderSections = (sections: StorageLocation[]) => {
        const getSection = (num: number) => sections.find(s => s.name.endsWith(`-${num}`));
        
        const sectionGrid = [
            [8, 7, 6, 5],
            [1, 2, 3, 4]
        ];

        return (
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-md">
                {sectionGrid.flat().map(num => {
                    const section = getSection(num);
                    if (!section) return <div key={num} className="h-12 w-12 rounded bg-gray-300 dark:bg-gray-600" />;
                    return <Section key={section.id} id={section.id} code={section.name.split('-').pop()!} items={itemsByLocationId.get(section.id) || []} onClick={() => onSectionClick(section)} isHighlighted={highlightId === section.id} />;
                })}
            </div>
        );
    };

    return (
        <Card className="bg-white/60 dark:bg-black/40 backdrop-blur-sm">
            <Tabs defaultValue="floor1" className="w-full">
                <CardHeader className="p-3">
                    <CardTitle className="text-base">{name}</CardTitle>
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="floor1" className="text-xs h-6">{t('floor')} 1</TabsTrigger>
                        <TabsTrigger value="floor2" className="text-xs h-6">{t('floor')} 2</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="p-2">
                    <TabsContent value="floor1" className="m-0">{renderSections(floors.floor1)}</TabsContent>
                    <TabsContent value="floor2" className="m-0">{renderSections(floors.floor2)}</TabsContent>
                </CardContent>
            </Tabs>
        </Card>
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-foreground p-4 md:p-8">
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
                    <Card className="bg-blue-200/50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 h-24 flex items-center justify-center">
                        <CardTitle className="text-blue-800 dark:text-blue-200">D3</CardTitle>
                    </Card>
                    <WarehouseCard name="K1" floors={kWarehouse.k1} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} />
                </div>

                {/* Middle Column */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                    <Card className="bg-blue-200/50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 flex-grow min-h-[300px] flex items-center justify-center">
                        <CardTitle className="text-blue-800 dark:text-blue-200">D1</CardTitle>
                    </Card>
                     <Card className="bg-blue-200/50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 min-h-[150px] flex items-center justify-center">
                        <CardTitle className="text-blue-800 dark:text-blue-200">D2</CardTitle>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <WarehouseCard name="H3" floors={hWarehouses.h3} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} />
                    <WarehouseCard name="H2" floors={hWarehouses.h2} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} />
                    <WarehouseCard name="H1" floors={hWarehouses.h1} onSectionClick={handleSectionClick} itemsByLocationId={itemsByLocationId} highlightId={highlightId} />
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
