
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, Truck, User, Eye, Search, Inbox, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO, isSameMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

export default function TransferArchivePage() {
  const { transfers, transferItems } = useAppContext();
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  
  const isLoading = !transfers || !transferItems;

  const sortedTransfers = useMemo(() => {
    if (!transfers) return [];
    
    let itemsToDisplay = transfers;

    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();

      const transferIdsWithMatchingItems = new Set<string>();
      if (transferItems) {
        transferItems.forEach(item => {
          if ((item.model.toLowerCase().includes(queryLower) || item.invoiceNo?.toLowerCase().includes(queryLower)) && item.transferId) {
            transferIdsWithMatchingItems.add(item.transferId);
          }
        });
      }
      
      itemsToDisplay = transfers.filter(t => {
        const invoiceMatch = t.invoiceNumber?.toString().padStart(6, '0').includes(searchQuery);
        const modelMatch = transferIdsWithMatchingItems.has(t.id);
        return invoiceMatch || modelMatch;
      });

    } else if (selectedMonth) {
      itemsToDisplay = transfers.filter(t => 
        t.transferDate && 
        !isNaN(parseISO(t.transferDate).getTime()) && 
        isSameMonth(parseISO(t.transferDate), selectedMonth)
      );
    }
    
    return itemsToDisplay.sort((a, b) => {
        const dateA = a.transferDate ? parseISO(a.transferDate).getTime() : 0;
        const dateB = b.transferDate ? parseISO(b.transferDate).getTime() : 0;
        return dateB - dateA;
    });
  }, [transfers, transferItems, selectedMonth, searchQuery]);
  
  const detailedSearchResults = useMemo(() => {
    if (!searchQuery.trim() || !transferItems || !transfers) {
      return [];
    }

    const queryLower = searchQuery.toLowerCase();

    return transferItems
      .filter(item => 
        item.transferId && 
        (item.model.toLowerCase().includes(queryLower) || item.invoiceNo?.toLowerCase().includes(queryLower))
      )
      .map(item => {
        const transfer = transfers.find(t => t.id === item.transferId);
        return {
          ...item,
          transferCargoName: transfer?.cargoName || 'N/A',
          transferDate: transfer?.transferDate,
          transferId: transfer?.id
        };
      })
      .sort((a,b) => {
          const dateA = a.transferDate ? parseISO(a.transferDate).getTime() : 0;
          const dateB = b.transferDate ? parseISO(b.transferDate).getTime() : 0;
          return dateB - dateA;
      });
  }, [searchQuery, transferItems, transfers]);

  const handlePrint = () => {
    window.print();
  };

  const PageContent = () => (
      <div className="space-y-8">
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : sortedTransfers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTransfers.map(transfer => (
                <Card key={transfer.id} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg leading-tight">{transfer.cargoName}</CardTitle>
                                <CardDescription>{t('to_destination')}: {transfer.destinationCity}</CardDescription>
                            </div>
                             <span className="text-xs font-mono text-muted-foreground mt-1">
                                #{transfer.invoiceNumber ? transfer.invoiceNumber.toString().padStart(6, '0') : 'N/A'}
                             </span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-primary" /> {transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A'}</p>
                    <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> {t('driver')}: {transfer.driverName}</p>
                    <p className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {t('manager')}: {transfer.warehouseManagerName}</p>
                    </CardContent>
                    <CardContent className="flex justify-between items-center print:hidden">
                        <p className="font-bold text-sm text-primary">{transfer.itemIds.length} {t('items_lowercase')}</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/transmit/archive/${transfer.id}`}>
                                <Eye className="mr-2 h-4 w-4"/> {t('view')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_results')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery 
                ? t('no_transfers_found_for_search', {query: searchQuery}) 
                : t('no_archived_transfers')
              }
            </p>
          </div>
        )}

        {searchQuery && detailedSearchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('matching_item_details')}</CardTitle>
              <CardDescription>
                {t('matching_item_details_desc', { query: searchQuery })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('model')}</TableHead>
                    <TableHead>{t('quantity_short')}</TableHead>
                    <TableHead>{t('invoice_no')}</TableHead>
                    <TableHead>{t('transfer')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedSearchResults.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.invoiceNo || t('na')}</TableCell>
                      <TableCell>
                        <Button variant="link" asChild className="p-0 h-auto print:hidden">
                          <Link href={`/transmit/archive/${item.transferId}`}>
                            {item.transferCargoName}
                          </Link>
                        </Button>
                        <span className="hidden print:inline">{item.transferCargoName}</span>
                      </TableCell>
                      <TableCell>
                        {item.transferDate ? format(parseISO(item.transferDate), 'PPP') : t('na')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
  );

  return (
    <>
      <div className="hidden print:block">
        <ReportWrapper>
          <PageContent />
        </ReportWrapper>
      </div>
      <div className="h-screen bg-background text-foreground flex flex-col print:hidden">
        <header className="p-4 md:p-8 flex items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/transmit">
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">{t('view_transfers')}</h1>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder={t('search_by_invoice_or_model')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                  />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-48 justify-start text-left font-normal", !selectedMonth && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedMonth ? format(selectedMonth, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={setSelectedMonth}
                    captionLayout="dropdown-nav" fromYear={2020} toYear={2040}
                  />
                </PopoverContent>
              </Popover>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <PageContent />
        </main>
      </div>
    </>
  );
}
