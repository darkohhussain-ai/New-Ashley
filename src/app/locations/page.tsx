
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Warehouse, MapPin, Loader2, Wand2, Map, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { useAppContext } from '@/context/app-provider';
import type { Item, StorageLocation, ExcelFile } from '@/lib/types';


type SearchResult = Item & {
    locationName: string;
    fileName: string;
    excelFileDate: string;
    warehouseType: 'Ashley' | 'Huana' | null;
};

export default function LocationsPage() {
  const { locations, setLocations, items: allItems, excelFiles } = useAppContext();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
  
  // Filter states
  const [filterWarehouse, setFilterWarehouse] = useState<'All' | 'Ashley' | 'Huana'>('All');
  const [filterHuanaWarehouse, setFilterHuanaWarehouse] = useState('All');
  const [filterHuanaFloor, setFilterHuanaFloor] = useState('All');
  const [filterAshleyFloor, setFilterAshleyFloor] = useState('All');
  const [filterAshleyArea, setFilterAshleyArea] = useState('All');

  useEffect(() => {
    if (locations && allItems && excelFiles) {
        setIsLoading(false);
    }
  },[locations, allItems, excelFiles]);

  const getLocationInfo = (locationId?: string) => {
    if (!locationId) return { name: 'N/A', warehouseType: null };
    const location = locations?.find(loc => loc.id === locationId);
    return {
        name: location?.name || 'N/A',
        warehouseType: location?.warehouseType || null
    };
  }
  
  const getFileInfo = (fileId: string) => {
    return excelFiles?.find(file => file.id === fileId);
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
    }
    setIsSearching(true);
    
    const queryLower = searchQuery.toLowerCase();
    const results = allItems
      .filter(item => item.model.toLowerCase().includes(queryLower))
      .map(item => {
        const fileInfo = getFileInfo(item.fileId);
        const locationInfo = getLocationInfo(item.locationId);
        return {
          ...item,
          locationName: locationInfo.name,
          fileName: fileInfo?.storageName || 'Unknown File',
          excelFileDate: fileInfo?.date || new Date().toISOString(),
          warehouseType: locationInfo.warehouseType,
        };
      });

    setSearchResults(results);
    setIsSearching(false);
    if(results.length === 0) {
        toast({
            title: "No results",
            description: `No items found with model containing "${searchQuery}".`
        })
    }
  };


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
    if (!generatedCode || !warehouseType) {
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

    const locationData: StorageLocation = { id: crypto.randomUUID(), name: generatedCode, warehouseType };
    setLocations([...locations, locationData]);
    
    toast({
      title: "Location Added",
      description: `${generatedCode} has been added to your storage locations.`,
    });
    resetForm();
  };
  
  const handleGenerateAll = async () => {
    if (!locations) return;

    setIsGenerating(true);
    const existingNames = new Set(locations.map(l => l.name));
    let newLocations: StorageLocation[] = [];

    // Huana: 3 warehouses, 2 floors, 8 sections
    for (let w = 1; w <= 3; w++) {
      for (let f = 1; f <= 2; f++) {
        for (let s = 1; s <= 8; s++) {
          const code = `H-${w}-${f}-${s}`;
          if (!existingNames.has(code)) newLocations.push({ id: crypto.randomUUID(), name: code, warehouseType: 'Huana' });
        }
      }
    }

    // Ashley Floor 4: 16 sections
    for (let s = 1; s <= 16; s++) {
      const code = `A-4-${s}`;
      if (!existingNames.has(code)) newLocations.push({ id: crypto.randomUUID(), name: code, warehouseType: 'Ashley' });
    }

    // Ashley Floor 3, Area 1: 6 units, 4 sections
    for (let u = 1; u <= 6; u++) {
      for (let s = 1; s <= 4; s++) {
        const code = `A-3-1-${u}-${s}`;
        if (!existingNames.has(code)) newLocations.push({ id: crypto.randomUUID(), name: code, warehouseType: 'Ashley' });
      }
    }

    // Ashley Floor 3, Area 2 (Office): 6 locations
    const officeCodes = ['RF', 'RB', 'MF', 'MB', 'LF', 'LB'];
    for (const oc of officeCodes) {
      const code = `A-3-O-${oc}`;
      if (!existingNames.has(code)) newLocations.push({ id: crypto.randomUUID(), name: code, warehouseType: 'Ashley' });
    }

    if (newLocations.length === 0) {
      toast({ title: "No new locations", description: "All possible locations already exist in the database." });
      setIsGenerating(false);
      return;
    }

    setLocations(prev => [...prev, ...newLocations]);
    toast({ title: "Success", description: `${newLocations.length} new location(s) have been added.` });
    setIsGenerating(false);
  };


  const handleDelete = (locationId: string) => {
    setLocations(locations.filter(loc => loc.id !== locationId));
    toast({
      title: "Location Deleted",
      description: "The location has been removed.",
    });
  };

  const handleDeleteAll = async () => {
    if (!locations || locations.length === 0) return;
    setLocations([]);
    toast({
        title: "All Locations Deleted",
        description: "All storage locations have been removed.",
    });
  };

  const sortedLocations = useMemo(() => {
    if (!locations) return { ashley: [], huana: [] };
    
    let filtered = locations;

    if (filterWarehouse !== 'All') {
      filtered = filtered.filter(l => l.warehouseType === filterWarehouse);
    }

    if (filterWarehouse === 'Huana') {
        if(filterHuanaWarehouse !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`H-${filterHuanaWarehouse}-`));
        }
        if(filterHuanaFloor !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`H-${filterHuanaWarehouse}-${filterHuanaFloor}-`));
        }
    }
    
    if(filterWarehouse === 'Ashley') {
        if(filterAshleyFloor !== 'All') {
            filtered = filtered.filter(l => l.name.startsWith(`A-${filterAshleyFloor}-`));
        }
        if(filterAshleyArea !== 'All' && filterAshleyFloor === '3') { // Area filter is only for floor 3
            filtered = filtered.filter(l => l.name.startsWith(`A-3-${filterAshleyArea}-`));
        }
    }


    const ashley = filtered.filter(l => l.warehouseType === 'Ashley').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const huana = filtered.filter(l => l.warehouseType === 'Huana').sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    return { ashley, huana };
  }, [locations, filterWarehouse, filterHuanaWarehouse, filterHuanaFloor, filterAshleyFloor, filterAshleyArea]);

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
          <Card className="mb-8">
            <CardHeader>
                <CardTitle>Search Item by Model</CardTitle>
                <CardDescription>Find item locations across all Excel files.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder="Enter model name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching || isLoading}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Model</TableHead>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>File Date</TableHead>
                                    <TableHead>Map</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searchResults.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                          <Link href={`/archive/${item.fileId}#${item.id}`} className="hover:underline text-primary">
                                            {item.model}
                                          </Link>
                                        </TableCell>
                                        <TableCell>
                                          <Link href={`/archive/${item.fileId}`} className="hover:underline text-muted-foreground">
                                            {item.fileName}
                                          </Link>
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.locationName}</TableCell>
                                        <TableCell>{format(parseISO(item.excelFileDate), 'PPP')}</TableCell>
                                        <TableCell>
                                            {item.locationId && item.warehouseType && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/${item.warehouseType.toLowerCase()}-map#${item.locationId}`}>View on Map</Link>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Select a warehouse and area to narrow down the list of locations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
                 <Select value={filterWarehouse} onValueChange={(v: 'All' | 'Ashley' | 'Huana') => setFilterWarehouse(v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Warehouse..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Warehouses</SelectItem>
                        <SelectItem value="Ashley">Ashley</SelectItem>
                        <SelectItem value="Huana">Huana</SelectItem>
                    </SelectContent>
                </Select>
                
                {filterWarehouse === 'Huana' && (
                    <>
                        <Select value={filterHuanaWarehouse} onValueChange={setFilterHuanaWarehouse}>
                             <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Huana Warehouse..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Huana Warehouses</SelectItem>
                                {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>Warehouse {n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {filterHuanaWarehouse !== 'All' && (
                             <Select value={filterHuanaFloor} onValueChange={setFilterHuanaFloor}>
                                 <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Floor..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Floors</SelectItem>
                                    {[1, 2].map(n => <SelectItem key={n} value={String(n)}>Floor {n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </>
                )}

                {filterWarehouse === 'Ashley' && (
                    <>
                        <Select value={filterAshleyFloor} onValueChange={setFilterAshleyFloor}>
                             <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Floor..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Floors</SelectItem>
                                <SelectItem value="4">Floor 4</SelectItem>
                                <SelectItem value="3">Floor 3</SelectItem>
                            </SelectContent>
                        </Select>
                        {filterAshleyFloor === '3' && (
                            <Select value={filterAshleyArea} onValueChange={setFilterAshleyArea}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Area..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Areas on Floor 3</SelectItem>
                                    <SelectItem value="1">Area 1</SelectItem>
                                    <SelectItem value="O">Area 2 (Office)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </>
                )}
            </CardContent>
          </Card>

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
        ) : (
          <div className="space-y-8">
            {(filterWarehouse === 'All' || filterWarehouse === 'Ashley') && sortedLocations.ashley.length > 0 && (
                 <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Warehouse className="text-primary"/> Ashley Warehouse</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
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
                    </CardContent>
                  </Card>
            )}

            {(filterWarehouse === 'All' || filterWarehouse === 'Huana') && sortedLocations.huana.length > 0 && (
                <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Warehouse className="text-primary"/> Huana Warehouse</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
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
                    </CardContent>
                </Card>
            )}
            
            {sortedLocations.ashley.length === 0 && sortedLocations.huana.length === 0 && !isLoading && (
                 <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Locations Match Filters</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Try adjusting or clearing the filters to see more locations.</p>
                </div>
            )}
            
            {locations && locations.length === 0 && !isLoading && (
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
          </div>
        )}
        </main>
      </Dialog>
    </div>
  );
}
