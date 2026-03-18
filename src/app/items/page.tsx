
'use client';

import Link from 'next/link';
import {
  MapPin,
  FilePlus,
  Upload,
  Archive,
  Search as SearchIcon,
  Loader2,
  Calendar,
  ArrowLeft,
  FileSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/context/app-provider';
import type { Item, StorageLocation, ExcelFile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { AshleyMap } from '@/components/maps/AshleyMap';
import { HuanaMap } from '@/components/maps/HuanaMap';

type SearchResult = Item & {
  locationName: string;
  fileName: string;
  excelFileDate: string;
  warehouseType: 'Ashley' | 'Huana' | null;
};

function ItemsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { locations, items: allItems, excelFiles } = useAppContext();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State for highlighting on map
  const [highlightedLocationId, setHighlightedLocationId] = useState<
    string | null
  >(null);

  // State for dialog when clicking a shelf
  const [selectedLocation, setSelectedLocation] =
    useState<StorageLocation | null>(null);
  const [itemsInLocation, setItemsInLocation] = useState<Item[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const menuItems = [
    {
      title: t('manage_locations'),
      icon: MapPin,
      href: '/locations',
      permission: 'page:items:locations',
      color: 'text-blue-500',
      hoverColor: 'hover:bg-blue-500/10',
    },
    {
      title: t('new_excel_file'),
      icon: FilePlus,
      href: '/new-file',
      permission: 'page:items:new',
      color: 'text-green-500',
      hoverColor: 'hover:bg-green-500/10',
    },
    {
      title: t('import_excel_file'),
      icon: Upload,
      href: '/import',
      permission: 'page:items:import',
      color: 'text-orange-500',
      hoverColor: 'hover:bg-orange-500/10',
    },
    {
      title: t('import_pdf_data'),
      icon: FileSearch,
      href: '/import-pdf',
      permission: 'page:items:import',
      color: 'text-emerald-500',
      hoverColor: 'hover:bg-emerald-500/10',
    },
    {
      title: t('excel_archive'),
      icon: Archive,
      href: '/archive',
      permission: 'page:items:archive',
      color: 'text-purple-500',
      hoverColor: 'hover:bg-purple-500/10',
    },
    {
      title: t('pdf_archive'),
      icon: Archive,
      href: '/pdf-archive',
      permission: 'page:items:archive',
      color: 'text-red-500',
      hoverColor: 'hover:bg-red-500/10',
    },
  ].filter(item => hasPermission(item.permission));

  const itemsByLocationId = useMemo(() => {
    if (!allItems) return new Map<string, Item[]>();
    return allItems.reduce((acc, item) => {
      if (item.locationId) {
        if (!acc.has(item.locationId)) acc.set(item.locationId, []);
        acc.get(item.locationId)!.push(item);
      }
      return acc;
    }, new Map<string, Item[]>());
  }, [allItems]);

  const getLocationInfo = (locationId?: string) => {
    if (!locationId || !locations) return { name: 'N/A', warehouseType: null };
    const location = locations.find(loc => loc.id === locationId);
    return {
      name: location?.name || 'N/A',
      warehouseType: location?.warehouseType || null,
    };
  };

  const getFileInfo = (fileId: string) => {
    if (!excelFiles) return undefined;
    return excelFiles.find(file => file.id === fileId);
  };

  const handleSectionClick = (location: StorageLocation) => {
    setSelectedLocation(location);
    setItemsInLocation(itemsByLocationId.get(location.id) || []);
    setIsDialogOpen(true);
  };

  const handleSearch = () => {
    setHighlightedLocationId(null);
    if (!searchQuery.trim() || !allItems) {
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

    if (results.length > 0) {
      const firstResult = results[0];
      if (firstResult.locationId) {
        setHighlightedLocationId(firstResult.locationId);
        // Scroll to the highlighted element
        setTimeout(() => {
          const element = document.getElementById(firstResult.locationId!);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } else {
      toast({
        title: t('no_results'),
        description: t('no_results_desc', { query: searchQuery }),
      });
    }
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t('items_in_location', {
                locationName: selectedLocation?.name,
              })}
            </DialogTitle>
            <DialogDescription>{t('items_in_location_desc')}</DialogDescription>
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
              <p className="text-center text-muted-foreground p-8">
                {t('no_items_in_this_location')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="h-screen bg-background text-foreground flex flex-col">
        <header className="bg-card border-b p-4">
          <div className="w-full mx-auto flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                <ArrowLeft />
                <span className="sr-only">{t('back_to_dashboard')}</span>
              </Link>
            </Button>
            <h1 className="text-xl font-bold">{t('placement_storage')}</h1>
          </div>
        </header>
        <main className="w-full p-4 md:p-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
            <aside className="lg:col-span-1 space-y-4">
              <nav className="flex flex-col gap-2">
                {menuItems.map(item => (
                  <Link key={item.href} href={item.href} passHref>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start text-base p-6',
                        item.hoverColor
                      )}
                    >
                      <item.icon className={cn('mr-3 h-5 w-5', item.color)} />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </nav>
            </aside>
            <div className="lg:col-span-3 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('search_item_by_model')}</CardTitle>
                  <CardDescription>
                    {t('search_item_by_model_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <Input
                      type="text"
                      placeholder={t('search_by_model')}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <SearchIcon className="mr-2 h-4 w-4" />
                      )}
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Link
                                  href={`/archive/${item.fileId}#${item.id}`}
                                  className="hover:underline text-primary"
                                >
                                  {item.model}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Link
                                  href={`/archive/${item.fileId}`}
                                  className="hover:underline text-muted-foreground"
                                >
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Accordion
                type="multiple"
                defaultValue={['ashley-map', 'huana-map']}
                className="w-full space-y-4"
              >
                <AccordionItem value="ashley-map" className="border-b-0">
                  <AccordionTrigger className="text-xl p-4 bg-card rounded-lg hover:no-underline">
                    {t('ashley_map')}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <AshleyMap
                      locations={locations}
                      itemsByLocationId={itemsByLocationId}
                      onSectionClick={handleSectionClick}
                      highlightId={highlightedLocationId}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="huana-map" className="border-b-0">
                  <AccordionTrigger className="text-xl p-4 bg-card rounded-lg hover:no-underline">
                    {t('huana_map')}
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <HuanaMap
                      locations={locations}
                      itemsByLocationId={itemsByLocationId}
                      onSectionClick={handleSectionClick}
                      highlightId={highlightedLocationId}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default withAuth(ItemsPage);
