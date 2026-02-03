
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Warehouse, MapPin, Loader2, Wand2, Map, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
import { useTranslation } from '@/hooks/use-translation';


type SearchResult = Item & {
    locationName: string;
    fileName: string;
    excelFileDate: string;
    warehouseType: 'Ashley' | 'Huana' | null;
};

export default function LocationsPage() {
  const { t } = useTranslation();
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
            title: t('no_results'),
            description: t('no_results_desc', {query: searchQuery})
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
        return `${huanaWarehouse}-${huanaFloor}-${huanaSection}`;
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
        title: t('incomplete_code'),
        description: t('incomplete_code_desc'),
      });
      return;
    }
    
    if (locations?.some(loc => loc.name === generatedCode)) {
        toast({ variant: "destructive", title: t('duplicate_code'), description: t('duplicate_code_desc') });
        return;
    }

    const locationData: StorageLocation = { id: crypto.randomUUID(), name: generatedCode, warehouseType };
    setLocations([...locations, locationData]);
    
    toast({
      title: t('location_added'),
      description: t('location_added_desc', {code: generatedCode}),
    });
    resetForm();
  };
  
  const handleGenerateAll = async () => {
    setIsGenerating(true);
    setLocations(prevLocations => {
      const existingNames = new Set(prevLocations.map(l => l.name));
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

      // K1 Hall: 1 warehouse, 2 floors, 8 sections
      for (let f = 1; f <= 2; f++) {
        for (let s = 1; s <= 8; s++) {
          const code = `K-1-${f}-${s}`;
          if (!existingNames.has(code)) newLocations.push({ id: crypto.randomUUID(), name: code, warehouseType: 'Huana' });
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
        return prevLocations;
      }
  
      toast({ title: "Success", description: `${newLocations.length} new location(s) have been added.` });
      return [...prevLocations, ...newLocations];
    });
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
    <div className="h-screen bg-background text-foreground flex flex-col">
      <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
        <header className="p-4 md:p-8 flex items-center justify-between gap-4 flex-wrap border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/items">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl">{t('manage_locations')}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" asChild><Link href="/ashley-map"><Map className="mr-2"/>{t('ashley_map')}</Link></Button>
            <Button variant="outline" asChild><Link href="/huana-map"><Map className="mr-2"/>{t('huana_map')}</Link></Button>
            <Button onClick={handleGenerateAll} variant="outline" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                {t('generate_all')}
            </Button>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> {t('add_location')}
              </Button>
            </DialogTrigger>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isGenerating || !locations || locations.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> {t('remove_all')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('are_you_sure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('confirm_delete_all_locations', {count: locations?.length || 0})}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll}>{t('delete_all')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('add_new_location')}</DialogTitle>
            <DialogDescription>
                Select the warehouse and fill in the details to generate a unique location code.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{t('warehouse')}</Label>
              <Select onValueChange={(value: 'Ashley' | 'Huana') => setWarehouseType(value)} value={warehouseType}>
                <SelectTrigger><SelectValue placeholder={t('select_a_warehouse')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ashley">Ashley</SelectItem>
                  <SelectItem value="Huana">Huana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {warehouseType === 'Huana' && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/50">
                 <div className="space-y-2">
                    <Label>{t('warehouse')}</Label>
                    <Select onValueChange={setHuanaWarehouse} value={huanaWarehouse}>
                       <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="H-1">H1</SelectItem>
                          <SelectItem value="H-2">H2</SelectItem>
                          <SelectItem value="H-3">H3</SelectItem>
                          <SelectItem value="K-1">K1</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label>{t('floor')}</Label>
                    <Select onValueChange={setHuanaFloor} value={huanaFloor}>
                       <SelectTrigger><SelectValue placeholder="1-2" /></SelectTrigger>
                       <SelectContent>{[1,2].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                 </div>
                  <div className="space-y-2">
                    <Label>{t('section')}</Label>
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
                    <Label>{t('floor')}</Label>
                    <Select onValueChange={setAshleyFloor} value={ashleyFloor}>
                       <SelectTrigger><SelectValue placeholder="3 or 4" /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="3">{t('floor')} 3</SelectItem>
                          <SelectItem value="4">{t('floor')} 4</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                  {ashleyFloor === '4' && (
                    <div className="space-y-2">
                      <Label>{t('section')}</Label>
                      <Select onValueChange={setAshleySection} value={ashleySection}>
                         <SelectTrigger><SelectValue placeholder="1-16" /></SelectTrigger>
                         <SelectContent>{Array.from({length: 16}, (_,i) => i+1).map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {ashleyFloor === '3' && (
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('area')}</Label>
                            <Select onValueChange={setAshleyArea} value={ashleyArea}>
                                <SelectTrigger><SelectValue placeholder={t('select_area')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">{t('area')} 1</SelectItem>
                                    <SelectItem value="O">{t('area')} 2 ({t('office')})</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {ashleyArea === '1' && (
                            <div className="space-y-4 pl-4 border-l-2">
                                <div className="space-y-2">
                                    <Label>{t('unit')}</Label>
                                    <Select onValueChange={setAshleyUnit} value={ashleyUnit}>
                                        <SelectTrigger><SelectValue placeholder="1-6" /></SelectTrigger>
                                        <SelectContent>{Array.from({length: 6}, (_,i) => i+1).map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('section')}</Label>
                                    <Select onValueChange={setAshleyUnitSection} value={ashleyUnitSection}>
                                        <SelectTrigger><SelectValue placeholder="1-4" /></SelectTrigger>
                                        <SelectContent>{[1,2,3,4].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        {ashleyArea === 'O' && (
                            <div className="space-y-2 pl-4 border-l-2">
                                <Label>{t('office_location')}</Label>
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
                <Label className="text-sm text-green-700 dark:text-green-300">{t('generated_code')}</Label>
                <p className="font-mono text-lg text-green-800 dark:text-green-200">{generatedCode}</p>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">{t('cancel')}</Button></DialogClose>
              <Button type="submit" disabled={!generatedCode}>{t('add_location')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Card className="mb-8">
            <CardHeader>
                <CardTitle>{t('search_item_by_model')}</CardTitle>
                <CardDescription>{t('search_item_by_model_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input 
                        type="text" 
                        placeholder={t('search_by_model')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching || isLoading}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        {t('search')}
                    </Button>
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('file_name')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
                                    <TableHead>{t('location')}</TableHead>
                                    <TableHead>{t('file_date')}</TableHead>
                                    <TableHead>Map</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {searchResults.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
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
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                {format(parseISO(item.excelFileDate), 'PPP')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {item.locationId && item.warehouseType && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/${item.warehouseType.toLowerCase()}-map#${item.locationId}`}>{t('view_on_map')}</Link>
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
                <CardTitle>{t('filters')}</CardTitle>
                <CardDescription>{t('filters_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
                 <Select value={filterWarehouse} onValueChange={(v: 'All' | 'Ashley' | 'Huana') => setFilterWarehouse(v)}>
                    <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_warehouse')} /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">{t('all_warehouses')}</SelectItem>
                        <SelectItem value="Ashley">Ashley</SelectItem>
                        <SelectItem value="Huana">Huana</SelectItem>
                    </SelectContent>
                </Select>
                
                {filterWarehouse === 'Huana' && (
                    <>
                        <Select value={filterHuanaWarehouse} onValueChange={setFilterHuanaWarehouse}>
                             <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_huana_warehouse')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">{t('all_huana_warehouses')}</SelectItem>
                                {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{t('warehouse')} {n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {filterHuanaWarehouse !== 'All' && (
                             <Select value={filterHuanaFloor} onValueChange={setFilterHuanaFloor}>
                                 <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_floor')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{t('all_floors')}</SelectItem>
                                    {[1, 2].map(n => <SelectItem key={n} value={String(n)}>{t('floor')} {n}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </>
                )}

                {filterWarehouse === 'Ashley' && (
                    <>
                        <Select value={filterAshleyFloor} onValueChange={setFilterAshleyFloor}>
                             <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_ashley_floor')} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">{t('all_floors')}</SelectItem>
                                <SelectItem value="4">{t('floor')} 4</SelectItem>
                                <SelectItem value="3">{t('floor')} 3</SelectItem>
                            </SelectContent>
                        </Select>
                        {filterAshleyFloor === '3' && (
                            <Select value={filterAshleyArea} onValueChange={setFilterAshleyArea}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('select_area')} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">{t('all_areas_on_floor_3')}</SelectItem>
                                    <SelectItem value="1">{t('area')} 1</SelectItem>
                                    <SelectItem value="O">{t('area')} 2 ({t('office')})</SelectItem>
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
                                      <Trash2 className="h-4 h-4"/>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('delete_location', {locationName: loc.name})}</AlertDialogTitle>
                                      <AlertDialogDescription>{t('cannot_be_undone')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(loc.id)}>{t('delete')}</AlertDialogAction>
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
                                      <Trash2 className="h-4 h-4"/>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('delete_location', {locationName: loc.name})}</AlertDialogTitle>
                                      <AlertDialogDescription>{t('cannot_be_undone')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(loc.id)}>{t('delete')}</AlertDialogAction>
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
                    <h3 className="mt-4 text-lg">{t('no_locations_match_filters')}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t('no_locations_match_filters_desc')}</p>
                </div>
            )}
            
            {locations && locations.length === 0 && !isLoading && (
              <Dialog open={open} onOpenChange={setOpen}>
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg">{t('no_locations_found')}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t('no_locations_found_desc')}</p>
                    <div className="mt-6 flex justify-center gap-4">
                      <Button onClick={handleGenerateAll} variant="outline" disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                        {t('generate_all')}
                      </Button>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" /> {t('add_manually')}
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
