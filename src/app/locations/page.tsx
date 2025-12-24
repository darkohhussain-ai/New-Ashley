
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Warehouse, MapPin } from 'lucide-react';
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
    if (!firestore || !generatedCode) {
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

  const handleDelete = (locationId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'storage_locations', locationId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Location Deleted",
      description: "The location has been removed.",
    });
  };

  const sortedLocations = useMemo(() => {
    if (!locations) return { ashley: [], huana: [] };
    const ashley = locations.filter(l => l.warehouseType === 'Ashley').sort((a, b) => a.name.localeCompare(b.name));
    const huana = locations.filter(l => l.warehouseType === 'Huana').sort((a, b) => a.name.localeCompare(b.name));
    return { ashley, huana };
  }, [locations]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/items">
                <ArrowLeft />
                <span className="sr-only">Back to Placement & Storage</span>
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Manage Locations</h1>
          </div>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Location
            </Button>
          </DialogTrigger>
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
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {sortedLocations.ashley.map(loc => (
                        <div key={loc.id} className="py-2 flex justify-between items-center group">
                           <div className="font-mono flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground"/>{loc.name}
                            </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
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
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {sortedLocations.huana.map(loc => (
                        <div key={loc.id} className="py-2 flex justify-between items-center group">
                           <div className="font-mono flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground"/>{loc.name}
                           </div>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
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
                <p className="mt-2 text-sm text-muted-foreground">Get started by adding your first storage location.</p>
                <div className="mt-6">
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Location
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
