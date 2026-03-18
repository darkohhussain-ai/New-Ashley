'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowLeft, MapPin, Box } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '@/components/ui/badge';

export default function PublicInventoryPage() {
  const { t } = useTranslation();
  const { settings, items, locations } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const locationResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.model.toLowerCase().includes(query)
    ).map(item => {
      const loc = locations.find(l => l.id === item.locationId);
      return {
        ...item,
        locationName: loc?.name || 'Unknown',
      };
    });
  }, [searchQuery, items, locations]);

  const backgroundEmbedSrc = useMemo(() => {
    if (!settings.loginBackgroundEmbed) return '';
    const cleanUrl = settings.loginBackgroundEmbed.split('?')[0];
    const videoId = cleanUrl.split('/').pop();
    return `${cleanUrl}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1`;
  }, [settings.loginBackgroundEmbed]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-slate-100 overflow-x-hidden">
      {/* Cinematic Background Layer */}
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
            <h1 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">Inventory Audit / پشکنینی کۆگا</h1>
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
          <div className="p-8 space-y-8 flex-1 flex flex-col">
            <div className="space-y-6 max-w-3xl mx-auto w-full">
              <div className="text-center space-y-2 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-full w-fit mx-auto border border-emerald-500/20">
                  <Box className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Global Search / گەڕانی گشتی</h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Neural Inventory Link</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-all" />
                <Input 
                  placeholder="ENTER MODEL NAME... / ناوی مۆدێل بنووسە" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 pl-14 bg-white/50 border-2 border-white/60 focus:border-primary/50 text-[13px] font-bold uppercase tracking-widest rounded-2xl shadow-sm transition-all text-slate-900 placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              <div className="border-2 border-white/60 rounded-2xl bg-white/30 overflow-hidden flex-1 shadow-inner min-h-[400px]">
                <Table>
                  <TableHeader className="bg-slate-100/50 sticky top-0 z-10 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-900 h-12">Model Identity</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-900 h-12">Position Path</TableHead>
                      <TableHead className="w-[100px] text-[10px] uppercase font-bold text-slate-900 text-center h-12">Cluster QTY</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationResults.length > 0 ? (
                      locationResults.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                          <TableCell className="font-bold text-[12px] text-slate-900 py-5">{item.model}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-[10px] font-bold uppercase px-3 py-1 rounded-lg">
                              <MapPin className="mr-1.5 w-3 h-3" /> {item.locationName}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-[12px] text-primary">{item.quantity}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-80 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                            <Search className="w-14 h-14 text-slate-900" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Awaiting Input Signal...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center border-t border-slate-200 bg-white/40 backdrop-blur-sm mt-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          ASHLEY STAFF INVENTORY AUDIT NODE
        </p>
      </footer>
    </div>
  );
}
