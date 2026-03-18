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
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-x-hidden">
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
          <Image src={settings.loginBackground} alt="BG" fill className="object-cover opacity-40" unoptimized />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />
      </div>

      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b-2 border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.appLogo && (
              <div className="relative w-8 h-8 bg-white rounded p-1 border border-white/30">
                <Image src={settings.appLogo} alt="Logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <h1 className="text-[12px] font-bold uppercase tracking-wider text-primary">Inventory Audit / پشکنینی کۆگا</h1>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
              <ArrowLeft className="mr-2 w-3.5 h-3.5" /> Back / گەڕانەوە
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-card/68 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-2xl overflow-hidden min-h-[70vh] flex flex-col animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 space-y-8 flex-1 flex flex-col">
            <div className="space-y-6 max-w-3xl mx-auto w-full">
              <div className="text-center space-y-2 mb-8">
                <div className="p-3 bg-emerald-500/10 rounded-full w-fit mx-auto border border-emerald-500/20">
                  <Box className="w-6 h-6 text-emerald-500" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-500">Global Search / گەڕانی گشتی</h2>
                <p className="text-[10px] opacity-50 uppercase font-bold">Neural Inventory Link</p>
              </div>

              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-60 group-focus-within:opacity-100 transition-all" />
                <Input 
                  placeholder="ENTER MODEL NAME... / ناوی مۆدێل بنووسە" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 pl-14 bg-white/5 border-2 border-white/10 focus:border-primary/50 text-[13px] font-bold uppercase tracking-widest rounded-2xl shadow-inner transition-all placeholder:text-muted-foreground/30"
                  autoFocus
                />
              </div>

              <div className="border-2 border-white/10 rounded-2xl bg-black/20 overflow-hidden flex-1 shadow-inner min-h-[400px]">
                <Table>
                  <TableHeader className="bg-primary/10 sticky top-0 z-10 border-b border-white/10">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold h-12">Model Identity</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-12">Position Path</TableHead>
                      <TableHead className="w-[100px] text-[10px] uppercase font-bold text-center h-12">Cluster QTY</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationResults.length > 0 ? (
                      locationResults.map((item) => (
                        <TableRow key={item.id} className="hover:bg-white/5 transition-colors border-white/5">
                          <TableCell className="font-bold text-[12px] text-white/90 py-5">{item.model}</TableCell>
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
                            <Search className="w-14 h-14" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-white">Awaiting Input Signal...</p>
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

      <footer className="relative z-10 py-8 text-center border-t border-white/10 bg-black/40 backdrop-blur-sm mt-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          ASHLEY STAFF INVENTORY AUDIT NODE
        </p>
      </footer>
    </div>
  );
}
