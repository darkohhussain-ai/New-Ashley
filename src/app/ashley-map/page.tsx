
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


const SectionButton = ({ id, code, items, onClick, className, isHighlighted }: { id: string, code: string; items: Item[]; onClick: () => void, className?: string, isHighlighted?: boolean }) => {
  const itemCount = items.length;
  return (
    <Button
      id={id}
      variant="outline"
      className={cn(`h-14 w-14 flex flex-col items-center justify-center p-1 border-2 transition-all duration-200 text-xs`,
        itemCount > 0 ? 'border-location-occupied-border bg-location-occupied-bg hover:bg-location-occupied-bg/80' : 'hover:border-muted-foreground/50',
        isHighlighted && 'ring-2 ring-offset-2 ring-primary',
        className
      )}
      onClick={onClick}
    >
      <span className="font-mono">{code}</span>
      {itemCount > 0 && (
        <span className="font-bold text-primary flex items-center gap-1 mt-1">
          <Box className="w-3 h-3" />
          {itemCount}
        </span>
      )}
    </Button>
  );
};

export default function AshleyMapPage() {
  const { locations, items: allItems } = useAppContext();
  const [highlightId, setHighlightId] = useState('');

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

  const { floor4, floor3 } = useMemo(() => {
    if (!ashleyLocations) return { floor4: [], floor3: { area1: [], office: [] } };
    
    const floor4 = ashleyLocations
      .filter(l => l.name.startsWith('A-4-'))
      .sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    
    const area1Units: Record<string, StorageLocation[]> = {};
    const office = ashleyLocations
      .filter(l => l.name.startsWith('A-3-O-'))
      .sort((a,b) => a.name.localeCompare(b.name));

    ashleyLocations.filter(l => l.name.startsWith('A-3-1-')).forEach(loc => {
      const parts = loc.name.split('-');
      if (parts.length !== 5) return;
      const unit = parts[3];
      if (!area1Units[unit]) area1Units[unit] = [];
      area1Units[unit].push(loc);
    });

    Object.values(area1Units).forEach(unitSections => 
      unitSections.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}))
    );
    
    const area1 = Object.keys(area1Units).sort().map(unitKey => ({
      name: `Unit ${unitKey}`,
      sections: area1Units[unitKey]
    }));

    return { floor4, floor3: { area1, office } };
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
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Ashley Warehouse Map</h1>
        </header>
        <main className="space-y-8">
          {isLoading ? (
            <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                    </Card>
                ))}
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Floor 4</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {floor4.map(loc => (
                      <SectionButton 
                        key={loc.id} 
                        id={loc.id}
                        code={loc.name.replace('A-4-', '')} 
                        items={itemsByLocationId.get(loc.id) || []}
                        isHighlighted={loc.id === highlightId}
                        onClick={() => handleSectionClick(loc)} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Floor 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Area 1</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {floor3.area1.map(unit => (
                        <Card key={unit.name} className="p-3">
                           <CardDescription className="text-center font-bold mb-2">{unit.name}</CardDescription>
                           <div className="grid grid-cols-2 gap-2">
                              {unit.sections.map(loc => (
                                <SectionButton 
                                  key={loc.id}
                                  id={loc.id}
                                  code={loc.name.split('-').slice(4).join('-')}
                                  items={itemsByLocationId.get(loc.id) || []}
                                  isHighlighted={loc.id === highlightId}
                                  onClick={() => handleSectionClick(loc)}
                                />
                              ))}
                           </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Area 2 (Office)</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                       {floor3.office.map(loc => (
                        <SectionButton 
                          key={loc.id}
                          id={loc.id} 
                          code={loc.name.replace('A-3-O-', '')} 
                          items={itemsByLocationId.get(loc.id) || []}
                          isHighlighted={loc.id === highlightId}
                          onClick={() => handleSectionClick(loc)} 
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
           {(!isLoading && floor4.length === 0 && floor3.area1.length === 0 && floor3.office.length === 0) && (
             <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Ashley Locations Found</h3>
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
