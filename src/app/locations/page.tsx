
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Warehouse, MapPin, Loader2, Wand2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type StorageLocation = {
  id: string;
  name: string;
  warehouseType: 'Ashley' | 'Huana';
};

export default function LocationsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const locationsRef = useMemoFirebase(() => (firestore ? collection(firestore, 'storage_locations') : null), [firestore]);
  const { data: locations, isLoading } = useCollection<StorageLocation>(locationsRef);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const [warehouseType, setWarehouseType] = useState<'Ashley' | 'Huana' | ''>('');

  // Huana state
  const [huanaWarehouse, setHuanaWarehouse] = useState('');
  const [huanaFloor, setHuanaFloor] = useState('');
  const [huanaSection, setHuanaSection] = useState('');

  // Ashley state
  const [ashleyFloor, setAshleyFloor] = useState('');
  const [ashleySection, setAshleySection] = useState('');
  const [ashleyArea, setAshleyArea] = useState('');
  const [ashleyUnit, setAshleyUnit] = useState('');
  const [ashleyUnitSection, setAshleyUnitSection] = useState('');
  const [ashleyOfficeCode, setAshleyOfficeCode] = useState('');

  const resetForm = () => {
    setWarehouseType('');
    setHuanaWarehouse('');
    setHuanaFloor('');
    setHuanaSection('');
    setAshleyFloor('');
    setAshleySection('');
    setAshleyArea('');
    setAshleyUnit('');
    setAshleyUnitSection('');
    setAshleyOfficeCode('');
    setOpen(false);
  };
  
  const generatedCode = useMemo(() => {
    if (warehouseType === 'Huana') {
      if (huanaWarehouse && huanaFloor && huanaSection) {
        return `H-${huanaWarehouse}-${huanaFloor}-${huanaSection}`;
      }
    } else if (warehouseType === 'Ashley') {
      if (ashleyFloor === '4' && ashleySection) {
        return `A-4-${ashleySection}`;
      } else if (ashleyFloor === '3') {
        if (ashleyArea === '1' && ashleyUnit && ashleyUnitSection) {
          return `A-3-1-${ashleyUnit}-${ashleyUnitSection}`;
        } else if (ashleyArea === 'O' && ashleyOfficeCode) {
          return `A-3-O-${ashleyOfficeCode}`;
        }
      }
    }
    return '';
  }, [warehouseType, huanaWarehouse, huanaFloor, huanaSection, ashleyFloor, ashleySection, ashleyArea, ashleyUnit, ashleyUnitSection, ashleyOfficeCode]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !generatedCode || !warehouseType) {
      toast({
        variant: "destructive",
        title: "Incomplete Code",
        description: "Please fill out all fields to generate a valid location code.",
      });
      return;
    }
    
    if (locations?.some(loc => loc.name === generatedCode)) {
        toast({ variant: "destructive", title: "Duplicate Code", description: "This location code already exists." });
        return;
    }

    const locationData = { name: generatedCode, warehouseType };
    addDocumentNonBlocking(locationsRef!, locationData);
    
    toast({
      title: "Location Added",
      description: `${generatedCode} has been added to your storage locations.`,
    });
    resetForm();
  };
  
  const handleGenerateAll = async () => {
    if (!firestore || !locations) return;

    setIsGenerating(true);
    const existingNames = new Set(locations.map(l => l.name));
    let newLocations: { name: string; warehouseType: 'Ashley' | 'Huana' }[] = [];

    // Huana: 3 warehouses, 2 floors, 8 sections
    for (let w = 1; w <= 3; w++) {
      for (let f = 1; f <= 2; f++) {
        for (let s = 1; s <= 8; s++) {
          const code = `H-${w}-${f}-${s}`;
          if (!existingNames.has(code)) newLocations.push({ name: code, warehouseType: 'Huana' });
        }
      }
    }

    // Ashley Floor 4: 16 sections
    for (let s = 1; s <= 16; s++) {
      const code = `A-4-${s}`;
      if (!existingNames.has(code)) newLocations.push({ name: code, warehouseType: 'Ashley' });
    }

    // Ashley Floor 3, Area 1: 6 units, 4 sections
    for (let u = 1; u <= 6; u++) {
      for (let s = 1; s <= 4; s++) {
        const code = `A-3-1-${u}-${s}`;
        if (!existingNames.has(code)) newLocations.push({ name: code, warehouseType: 'Ashley' });
      }
    }

    // Ashley Floor 3, Area 2 (Office): 6 locations
    const officeCodes = ['RF', 'RB', 'MF', 'MB', 'LF', 'LB'];
    for (const oc of officeCodes) {
      const code = `A-3-O-${oc}`;
      if (!existingNames.has(code)) newLocations.push({ name: code, warehouseType: 'Ashley' });
    }

    if (newLocations.length === 0) {
      toast({ title: "No new locations", description: "All possible locations already exist in the database." });
      setIsGenerating(false);
      return;
    }

    try {
      // Use chunks to avoid exceeding batch write limits if there are many locations
      const chunkSize = 400;
      for (let i = 0; i < newLocations.length; i += chunkSize) {
          const chunk = newLocations.slice(i, i + chunkSize);
          const batch = writeBatch(firestore);
          chunk.forEach(loc => {
            const newDocRef = doc(collection(firestore, 'storage_locations'));
            batch.set(newDocRef, loc);
          });
          await batch.commit();
      }
      toast({ title: "Success", description: `${newLocations.length} new location(s) have been added.` });
    } catch (e) {
      console.error("Failed to generate all locations:", e);
      toast({ variant: "destructive", title: "Error", description: "Could not add new locations." });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleDelete = (locationId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'storage_locations', locationId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Location Deleted",
      description: "The location has been removed.",
    });
  };

  const handleDeleteAll = async () => {
    if (!firestore || !locations || locations.length === 0) return;

    try {
      const batch = writeBatch(firestore);
      locations.forEach(loc => {
        const docRef = doc(firestore, 'storage_locations', loc.id);
        batch.delete(docRef);
      });
      await batch.commit();
      toast({
        title: "All Locations Deleted",
        description: "All storage locations have been removed.",
      });
    } catch (error) {
      console.error("Failed to delete all locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete all locations.",
      });
    }
  };

  const sortedLocations = useMemo(() => {
    if (!locations) return { ashley: [], huana: [] };
    const ashley = locations.filter(l => l.warehouseType === 'Ashley').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const huana = locations.filter(l => l.warehouseType === 'Huana').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return { ashley, huana };
  }, [locations]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
        <header className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/items">
                <ArrowLeft />
                <span className="sr-only">Back to Placement & Storage</span>
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Manage Locations</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" asChild><Link href="/ashley-map"><Map className="mr-2"/>Ashley Map</Link></Button>
            <Button variant="outline" asChild><Link href="/huana-map"><Map className="mr-2"/>Huana Map</Link></Button>
            <Button onClick={handleGenerateAll} variant="outline" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                Generate All
            </Button>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </DialogTrigger>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isGenerating || !locations || locations.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {locations?.length} storage locations. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Storage Location Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select onValueChange={(value: 'Ashley' | 'Huana') => setWarehouseType(value)} value={warehouseType}>
                <SelectTrigger><SelectValue placeholder="Select a warehouse" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ashley">Ashley</SelectItem>
                  <SelectItem value="Huana">Huana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {warehouseType === 'Huana' && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                 <div className="space-y-2">
                    <Label>Warehouse #</Label>
                    <Select onValueChange={setHuanaWarehouse} value={huanaWarehouse}>
                       <SelectTrigger><SelectValue placeholder="1-3" /></SelectTrigger>
                       <SelectContent>{[1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>Floor</Label>
                    <Select onValueChange={setHuanaFloor} value={huanaFloor}>
                       <SelectTrigger><SelectValue placeholder="1-2" /></SelectTrigger>
                       <SelectContent>{[1,2].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select onValueChange={setHuanaSection} value={huanaSection}>
                       <SelectTrigger><SelectValue placeholder="1-8" /></SelectTrigger>
                       <SelectContent>{Array.from({length: 8}, (_,i) => i+1).map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
              </div>
            )}
            
             {warehouseType === 'Ashley' && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                  <div className="space-y-2">
                    <Label>Floor</Label>
                    <Select onValueChange={setAshleyFloor} value={ashleyFloor}>
                       <SelectTrigger><SelectValue placeholder="3 or 4" /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="3">Floor 3</SelectItem>
                          <SelectItem value="4">Floor 4</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  {ashleyFloor === '4' && (
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select onValueChange={setAshleySection} value={ashleySection}>
                         <SelectTrigger><SelectValue placeholder="1-16" /></SelectTrigger>
                         <SelectContent>{Array.from({length: 16}, (_,i) => i+1).map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {ashleyFloor === '3' && (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Area</Label>
                            <Select onValueChange={setAshleyArea} value={ashleyArea}>
                                <SelectTrigger><SelectValue placeholder="Select Area" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Area 1</SelectItem>
                                    <SelectItem value="O">Area 2 (Office)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {ashleyArea === '1' && (
                            <div className="space-y-4 pl-4 border-l-2">
                                <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Select onValueChange={setAshleyUnit} value={ashleyUnit}>
                                        <SelectTrigger><SelectValue placeholder="1-6" /></SelectTrigger>
                                        <SelectContent>{Array.from({length: 6}, (_,i) => i+1).map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select onValueChange={setAshleyUnitSection} value={ashleyUnitSection}>
                                        <SelectTrigger><SelectValue placeholder="1-4" /></SelectTrigger>
                                        <SelectContent>{[1,2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        {ashleyArea === 'O' && (
                            <div className="space-y-2 pl-4 border-l-2">
                                <Label>Office Location</Label>
                                <Select onValueChange={setAshleyOfficeCode} value={ashleyOfficeCode}>
                                    <SelectTrigger><SelectValue placeholder="Select Code" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RF">Right – Front (RF)</SelectItem>
                                        <SelectItem value="RB">Right – Back (RB)</SelectItem>
                                        <SelectItem value="MF">Middle – Front (MF)</SelectItem>
                                        <SelectItem value="MB">Middle – Back (MB)</SelectItem>
                                        <SelectItem value="LF">Left – Front (LF)</SelectItem>
                                        <SelectItem value="LB">Left – Back (LB)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                     </div>
                  )}
              </div>
            )}
            
            {generatedCode && (
              <div className="space-y-2 p-3 border rounded-md bg-green-50 dark:bg-green-900/20">
                <Label className="text-sm text-green-700 dark:text-green-300">Generated Code</Label>
                <p className="font-mono font-bold text-lg text-green-800 dark:text-green-200">{generatedCode}</p>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={!generatedCode}>Add Location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      
        <main>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader><div className="h-7 w-40 rounded bg-muted"></div></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-10 w-full rounded bg-muted"></div>
                    <div className="h-10 w-full rounded bg-muted"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : locations && locations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Warehouse className="text-primary"/> Ashley Warehouse</CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedLocations.ashley.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                      {sortedLocations.ashley.map(loc => (
                        <div key={loc.id} className="py-2 flex justify-between items-center group">
                           <div className="font-mono flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground"/>{loc.name}
                            </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-4 w-4"/>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {loc.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(loc.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No locations added for Ashley warehouse.</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Warehouse className="text-primary"/> Huana Warehouse</CardTitle>
                </CardHeader>
                <CardContent>
                   {sortedLocations.huana.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                      {sortedLocations.huana.map(loc => (
                        <div key={loc.id} className="py-2 flex justify-between items-center group">
                           <div className="font-mono flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground"/>{loc.name}
                           </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 className="h-4 w-4"/>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {loc.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(loc.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-muted-foreground">No locations added for Huana warehouse.</p>}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Locations Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first storage location or generate all of them.</p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button onClick={handleGenerateAll} variant="outline" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                    Generate All
                  </Button>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Manually
                    </Button>
                  </DialogTrigger>
                </div>
              </div>
            </Dialog>
          )}
        </main>
      </Dialog>
    </div>
  );
}

    