
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-provider';
import type { Item, StorageLocation } from '@/lib/types';


const Section = ({ id, code, items, onClick, isHighlighted }: { id: string, code: string; items: Item[]; onClick: () => void, isHighlighted?: boolean }) => {
  const itemCount = items.length;
  return (
    <Button
      id={id}
      variant="outline"
      className={cn(`h-16 w-16 flex flex-col items-center justify-center p-1 border-2 transition-all duration-200`,
        itemCount > 0 ? 'border-location-occupied-border bg-location-occupied-bg hover:bg-location-occupied-bg/80' : 'hover:border-muted-foreground/50',
        isHighlighted && 'ring-2 ring-offset-2 ring-primary')}
      onClick={onClick}
    >
      <span className="text-xs font-mono">{code.split('-').slice(1).join('-')}</span>
      {itemCount > 0 && (
        <span className="text-xs font-bold text-primary flex items-center gap-1 mt-1">
          <Box className="w-3 h-3" />
          {itemCount}
        </span>
      )}
    </Button>
  );
};

export default function HuanaMapPage() {
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

  const warehouses = useMemo(() => {
    if (!huanaLocations) return [];
    const grouped: Record<string, Record<string, StorageLocation[]>> = {};

    huanaLocations.forEach(loc => {
      const parts = loc.name.split('-');
      if (parts.length !== 4) return;
      const [, warehouse, floor] = parts;
      if (!grouped[warehouse]) grouped[warehouse] = {};
      if (!grouped[warehouse][floor]) grouped[warehouse][floor] = [];
      grouped[warehouse][floor].push(loc);
    });
    
    for (const wh in grouped) {
        for (const fl in grouped[wh]) {
            grouped[wh][fl].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
        }
    }

    return Object.keys(grouped).sort().map(whKey => ({
      name: `Warehouse ${whKey}`,
      floors: Object.keys(grouped[whKey]).sort().map(flKey => ({
        name: `Floor ${flKey}`,
        sections: grouped[whKey][flKey]
      }))
    }));
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
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Huana Warehouse Map</h1>
        </header>
        <main className="space-y-8">
          {isLoading ? (
            <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                    </Card>
                ))}
            </div>
          ) : warehouses.length > 0 ? (
            warehouses.map(warehouse => (
              <Card key={warehouse.name}>
                <CardHeader>
                  <CardTitle>{warehouse.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {warehouse.floors.map(floor => (
                    <div key={floor.name}>
                      <h3 className="font-semibold mb-2">{floor.name}</h3>
                      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {floor.sections.map(section => (
                          <Section
                            key={section.id}
                            id={section.id}
                            code={section.name}
                            items={itemsByLocationId.get(section.id) || []}
                            isHighlighted={section.id === highlightId}
                            onClick={() => handleSectionClick(section)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Huana Locations Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">Go to 'Manage Locations' to generate the warehouse codes.</p>
                <Button asChild className="mt-4"><Link href="/locations">Manage Locations</Link></Button>
            </div>
          )}
        </main>
      </div>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Items in Location: {selectedLocation?.name}</DialogTitle>
          <CardDescription>A list of all items currently stored in this section.</CardDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {itemsInLocation.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {itemsInLocation.map(item => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.model}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-8">No items found in this location.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
