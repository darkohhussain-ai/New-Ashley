'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, ArrowLeft, Inbox, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';

export default function PublicTransmitPage() {
  const { t } = useTranslation();
  const { settings, transferItems } = useAppContext();
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const stagedItems = useMemo(() => {
    if (!activeCity) return [];
    return transferItems.filter(item => !item.transferId && item.destination === activeCity);
  }, [transferItems, activeCity]);

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
            <h1 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">Transmission Lists / لیستی گواستنەوەکان</h1>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 w-3.5 h-3.5" /> Back / گەڕانەوە
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-white/80 backdrop-blur-xl border-2 border-white/60 rounded-2xl shadow-2xl overflow-hidden min-h-[60vh] flex flex-col animate-in fade-in zoom-in-95 duration-500">
          {!activeCity ? (
            <div className="p-8 space-y-8 flex-1 flex flex-col justify-center">
              <div className="text-center space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">Select Destination / شار هەڵبژێرە</h2>
                <div className="h-0.5 w-12 bg-amber-500/40 mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                {["Erbil", "Baghdad", "Diwan", "Dohuk"].map((city) => (
                  <Button 
                    key={city} 
                    variant="outline" 
                    className="h-20 bg-slate-50/50 border-2 border-white/60 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-between px-8 text-sm font-bold uppercase tracking-tight text-slate-900 group transition-all"
                    onClick={() => setActiveCity(city)}
                  >
                    {city}
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <header className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900">{activeCity} Node</h2>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Staged Cargo Audit</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900"
                  onClick={() => setActiveCity(null)}
                >
                  <ArrowLeft className="mr-2 w-3.5 h-3.5" /> Back / گەڕانەوە
                </Button>
              </header>
              
              <div className="flex-1 p-0 overflow-auto">
                <Table>
                  <TableHeader className="bg-slate-100/50 sticky top-0 z-10 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="w-[60px] text-[10px] uppercase font-bold text-slate-900 text-center">Audit</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-900">Model Name</TableHead>
                      <TableHead className="w-[100px] text-[10px] uppercase font-bold text-slate-900 text-center">QTY</TableHead>
                      <TableHead className="w-[160px] text-[10px] uppercase font-bold text-slate-900">Invoice Ref</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagedItems.length > 0 ? (
                      stagedItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                          <TableCell className="p-4 text-center">
                            <Checkbox className="border-slate-300 data-[state=checked]:bg-primary" />
                          </TableCell>
                          <TableCell className="font-bold text-[12px] text-slate-900">{item.model}</TableCell>
                          <TableCell className="text-center font-bold text-[12px] text-primary">{item.quantity}</TableCell>
                          <TableCell className="text-[11px] text-slate-500 font-bold">#{item.invoiceNo || 'PENDING'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-96 text-center">
                          <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                            <Inbox className="w-12 h-12 text-slate-900" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Empty Sector for {activeCity}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center border-t border-slate-200 bg-white/40 backdrop-blur-sm mt-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
          ASHLEY STAFF LOGISTICS NODE
        </p>
      </footer>
    </div>
  );
}
