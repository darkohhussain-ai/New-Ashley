
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowLeft, MapPin, Box, FileText, Info } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';

export default function PublicInventoryPage() {
  const { t } = useTranslation();
  const { settings, items, locations, transferItems } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const inventoryResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    
    return items.filter(item => 
      item.model.toLowerCase().includes(query)
    ).map(item => {
      const loc = locations.find(l => l.id === item.locationId);
      // Check if this item model is linked to any staged or transferred item
      const transferRef = transferItems.find(ti => ti.model.toLowerCase() === item.model.toLowerCase());
      
      return {
        ...item,
        locationName: loc?.name || 'N/A',
        invoiceRef: transferRef?.invoiceNo || null
      };
    });
  }, [searchQuery, items, locations, transferItems]);

  const backgroundEmbedSrc = useMemo(() => {
    if (!settings.loginBackgroundEmbed) return '';
    const cleanUrl = settings.loginBackgroundEmbed.split('?')[0];
    const videoId = cleanUrl.split('/').pop();
    return `${cleanUrl}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1`;
  }, [settings.loginBackgroundEmbed]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-slate-100 overflow-x-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {settings.loginBackgroundEmbed ? (
          <div className="relative w-full h-full overflow-hidden">
            <iframe
              key={backgroundEmbedSrc}
              src={backgroundEmbedSrc}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] border-0"
              allow="autoplay; encrypted-media"
              title="Background Video"
            />
          </div>
        ) : settings.loginBackground ? (
          <Image src={settings.loginBackground} alt="BG" fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-slate-200" />
        )}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[1]" />
      </div>

      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b-2 border-white/60 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.appLogo && (
              <div className="relative w-8 h-8 bg-white rounded p-1 border border-slate-200">
                <Image src={settings.appLogo} alt="Logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <h1 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">ASHLEY STAFF | Inventory Audit</h1>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 w-3.5 h-3.5" /> Back / گەڕانەوە
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-white/80 backdrop-blur-xl border-2 border-white/60 rounded-2xl shadow-2xl overflow-hidden min-h-[70vh] flex flex-col animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 space-y-10 flex-1 flex flex-col">
            
            <div className="text-center space-y-2">
              <div className="p-3 bg-emerald-500/10 rounded-full w-fit mx-auto border border-emerald-500/20 mb-4">
                <Box className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Global Audit Terminal</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Real-time Location Synchronization</p>
            </div>

            <div className="relative group max-w-2xl mx-auto w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary transition-all" />
              <Input 
                placeholder="ENTER MODEL NAME... / ناوی مۆدێل بنووسە" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-20 pl-16 bg-white/50 border-2 border-white/60 focus:border-primary/50 text-[16px] font-bold uppercase tracking-widest rounded-2xl shadow-sm transition-all text-slate-900 placeholder:text-slate-300"
                autoFocus
              />
            </div>

            <div className="border-2 border-white/60 rounded-2xl bg-white/30 overflow-hidden flex-1 shadow-inner min-h-[400px]">
              <Table>
                <TableHeader className="bg-slate-100/50 sticky top-0 z-10 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-900 h-12">Model Identity</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-900 h-12">Warehouse Position</TableHead>
                    <TableHead className="w-[140px] text-[10px] uppercase font-bold text-slate-900 h-12">Invoice Ref</TableHead>
                    <TableHead className="w-[100px] text-[10px] uppercase font-bold text-slate-900 text-center h-12">Cluster QTY</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryResults.length > 0 ? (
                    inventoryResults.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-slate-100 h-16">
                        <TableCell className="font-bold text-[13px] text-slate-900">{item.model}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary opacity-60" />
                            <span className="text-[12px] font-bold text-slate-700">{item.locationName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.invoiceRef ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                              <FileText className="mr-1 w-2.5 h-3" /> {item.invoiceRef}
                            </Badge>
                          ) : (
                            <span className="text-[10px] font-medium opacity-20">No Slip Found</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-black text-[14px] text-primary">{item.quantity}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-[400px] text-center">
                        <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                          <Search className="w-16 h-16 text-slate-900" />
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Awaiting Signal</p>
                            <p className="text-[9px] uppercase font-medium">Enter at least 2 characters to audit inventory</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center border-t border-slate-200 bg-white/40 backdrop-blur-sm mt-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          ASHLEY STAFF INVENTORY AUDIT NODE | GLOBAL SYNC
        </p>
      </footer>
    </div>
  );
}
