'use client';

import Link from 'next/link';
import {
  MapPin,
  FilePlus,
  Upload,
  Archive,
  FileText,
  ArrowLeft,
  Warehouse,
  Search as SearchIcon,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-provider';
import type { Item, StorageLocation, ExcelFile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from 'date-fns';

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

    const menuItems = [
    {
      title: t("manage_locations"),
      icon: MapPin,
      href: "/locations",
      permission: 'page:items:locations',
    },
    {
      title: t("new_excel_file"),
      icon: FilePlus,
      href: "/new-file",
      permission: 'page:items:new',
    },
    {
      title: t("import_excel_file"),
      icon: Upload,
      href: "/import",
      permission: 'page:items:import',
    },
    {
      title: t("excel_archive"),
      icon: Archive,
      href: "/archive",
      permission: 'page:items:archive',
    },
    {
      title: t("pdf_archive"),
      icon: FileText,
      href: "/pdf-archive",
      permission: 'page:items:archive',
    }
  ].filter(item => hasPermission(item.permission));
  
  const getLocationInfo = (locationId?: string) => {
    if (!locationId || !locations) return { name: 'N/A', warehouseType: null };
    const location = locations.find(loc => loc.id === locationId);
    return {
        name: location?.name || 'N/A',
        warehouseType: location?.warehouseType || null
    };
  }
  
  const getFileInfo = (fileId: string) => {
    if (!excelFiles) return undefined;
    return excelFiles.find(file => file.id === fileId);
  }

  const handleSearch = () => {
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
    if(results.length === 0) {
        toast({
            title: t('no_results'),
            description: t('no_results_desc', {query: searchQuery})
        })
    }
  };

  return (
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
      <main className='w-full p-4 md:p-8 flex-1 overflow-y-auto'>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
            <aside className="lg:col-span-1">
                <nav className="flex flex-col gap-2">
                    {menuItems.map(item => (
                        <Link key={item.href} href={item.href} passHref>
                           <Button variant="ghost" className="w-full justify-start text-base p-6">
                               <item.icon className="mr-3 h-5 w-5" />
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
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-2 h-4 w-4" />}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Link href="/ashley-map">
                        <Card className="hover:shadow-lg transition-shadow h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Warehouse /> {t('ashley_warehouse_map')}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/huana-map">
                        <Card className="hover:shadow-lg transition-shadow h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Warehouse /> {t('huana_warehouse_map')}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(ItemsPage);
