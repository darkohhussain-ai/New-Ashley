
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [name, setName] = useState('');
  const [warehouseType, setWarehouseType] = useState<'Ashley' | 'Huana' | ''>('');

  const resetForm = () => {
    setName('');
    setWarehouseType('');
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !name || !warehouseType) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please provide a location name and select a warehouse type.",
      });
      return;
    }

    const locationData = { name, warehouseType };
    addDocumentNonBlocking(locationsRef!, locationData);
    
    toast({
      title: "Location Added",
      description: `${name} has been added to your storage locations.`,
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

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Storage Location</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Shelf A-1, Section 3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouseType">Warehouse Type</Label>
              <Select onValueChange={(value: 'Ashley' | 'Huana') => setWarehouseType(value)} value={warehouseType}>
                <SelectTrigger id="warehouseType">
                  <SelectValue placeholder="Select a warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ashley">Ashley</SelectItem>
                  <SelectItem value="Huana">Huana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit">Add Location</Button>
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
                           <Link href={`/locations/${loc.id}`} className="font-medium flex items-center gap-2 hover:text-primary transition-colors">
                              <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>{loc.name}
                            </Link>
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
                           <Link href={`/locations/${loc.id}`} className="font-medium flex items-center gap-2 hover:text-primary transition-colors">
                              <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors"/>{loc.name}
                           </Link>
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
