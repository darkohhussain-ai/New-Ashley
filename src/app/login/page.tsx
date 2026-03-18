'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Truck, MapPin, ListChecks, Inbox, ArrowLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { settings, transferItems, items, locations } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const [activeTransmissionCity, setActiveTransmissionCity] = useState<string | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      toast({ title: 'Access Granted', description: 'Welcome back.' });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Invalid credentials.',
      });
    }
  };

  const stagedItemsForCity = useMemo(() => {
    if (!activeTransmissionCity) return [];
    return transferItems.filter(item => !item.transferId && item.destination === activeTransmissionCity);
  }, [transferItems, activeTransmissionCity]);

  const locationResults = useMemo(() => {
    if (!locationSearchQuery.trim()) return [];
    const query = locationSearchQuery.toLowerCase();
    return items.filter(item => 
      item.model.toLowerCase().includes(query)
    ).map(item => {
      const loc = locations.find(l => l.id === item.locationId);
      return {
        ...item,
        locationName: loc?.name || 'Unknown',
      };
    });
  }, [locationSearchQuery, items, locations]);

  const backgroundEmbedSrc = useMemo(() => {
    if (!settings.loginBackgroundEmbed) return '';
    const cleanUrl = settings.loginBackgroundEmbed.split('?')[0];
    const videoId = cleanUrl.split('/').pop();
    return `${cleanUrl}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1`;
  }, [settings.loginBackgroundEmbed]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-x-hidden">
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
          <Image
            key={settings.loginBackground}
            src={settings.loginBackground}
            alt="Login background"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-[1]" />
      </div>

      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.appLogo && (
              <div className="relative w-10 h-10 bg-white rounded-lg p-1 border border-primary/10">
                <Image src={settings.appLogo} alt="Logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-[11px] font-bold uppercase tracking-widest text-primary leading-none">ASHLEY STAFF</h1>
              <span className="text-[9px] font-medium text-muted-foreground mt-1">ستافی ئاشلی</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Input
                type="text"
                placeholder="ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-8 w-28 bg-muted/50 border-primary/10 text-[10px]"
                required
              />
              <Input
                type="password"
                placeholder="Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 w-28 bg-muted/50 border-primary/10 text-[10px]"
                required
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="h-8 px-4 font-bold uppercase text-[10px]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Access / چوونەژوورەوە"}
            </Button>
          </form>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col justify-center items-center">
        <div className="flex flex-col gap-4 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
          {/* Transmission Lists Button - Amber/Yellow Theme */}
          <Dialog onOpenChange={(open) => !open && setActiveTransmissionCity(null)}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 w-full bg-amber-500/10 backdrop-blur-md border-amber-500/30 hover:bg-amber-500/20 text-[12px] font-bold uppercase tracking-wider flex flex-col gap-1 shadow-2xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2 text-amber-500">
                  <ListChecks className="w-5 h-5" />
                  Transmission Lists
                </div>
                <span className="text-[10px] font-medium opacity-80 text-white normal-case">لیستی گواستنەوەکان</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-card/68 backdrop-blur-xl border-primary/20 max-h-[85vh] overflow-hidden flex flex-col p-0">
              <header className="p-6 pb-2">
                <DialogTitle className="text-sm uppercase flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> 
                  {activeTransmissionCity || "Select City / شار هەڵبژێرە"}
                </DialogTitle>
              </header>
              
              <div className="flex-1 overflow-hidden p-6 pt-2 flex flex-col">
                {!activeTransmissionCity ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                    {["Erbil", "Baghdad", "Diwan", "Dohuk"].map((city) => (
                      <Button 
                        key={city} 
                        variant="outline" 
                        className="h-16 bg-muted/10 border-primary/10 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-between px-6 text-sm font-bold uppercase tracking-tight group"
                        onClick={() => setActiveTransmissionCity(city)}
                      >
                        {city}
                        <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col h-full space-y-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-fit text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 p-0"
                      onClick={() => setActiveTransmissionCity(null)}
                    >
                      <ArrowLeft className="mr-2 w-3 h-3" /> Back / گەڕانەوە
                    </Button>
                    
                    <div className="border rounded-lg bg-muted/10 overflow-hidden flex-1">
                      <div className="max-h-[50vh] overflow-auto">
                        <Table>
                          <TableHeader className="bg-primary/10 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="w-[50px] text-[9px] uppercase font-bold text-center">Audit</TableHead>
                              <TableHead className="text-[9px] uppercase font-bold">Model</TableHead>
                              <TableHead className="w-[80px] text-[9px] uppercase font-bold text-center">QTY</TableHead>
                              <TableHead className="w-[140px] text-[9px] uppercase font-bold">Invoice</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stagedItemsForCity.length > 0 ? (
                              stagedItemsForCity.map((item) => (
                                <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                                  <TableCell className="p-3 text-center">
                                    <Checkbox className="border-primary/30" />
                                  </TableCell>
                                  <TableCell className="font-bold text-[11px] text-white/90">{item.model}</TableCell>
                                  <TableCell className="text-center font-medium text-[11px] text-primary">{item.quantity}</TableCell>
                                  <TableCell className="text-[10px] opacity-60">#{item.invoiceNo || 'PENDING'}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="h-48 text-center">
                                  <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                                    <Inbox className="w-8 h-8" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white">No Active Cargo</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Inventory Audit Button - Emerald Green Theme */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-20 w-full bg-emerald-500/10 backdrop-blur-md border-emerald-500/30 hover:bg-emerald-500/20 text-[12px] font-bold uppercase tracking-wider flex flex-col gap-1 shadow-2xl transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2 text-emerald-500">
                  <Search className="w-5 h-5" />
                  Inventory Audit
                </div>
                <span className="text-[10px] font-medium opacity-80 text-white normal-case">پشکنینی کۆگا</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-card/68 backdrop-blur-xl border-primary/20 max-h-[85vh] overflow-hidden flex flex-col">
              <header>
                <DialogTitle className="text-sm uppercase flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" /> Global Search / گەڕانی گشتی
                </DialogTitle>
              </header>
              
              <div className="space-y-4 pt-4 flex-1 flex flex-col overflow-hidden">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60" />
                  <Input 
                    placeholder="ENTER MODEL NAME... / ناوی مۆدێل بنووسە" 
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="h-12 pl-12 bg-muted/20 border-primary/20 text-[11px] font-bold uppercase tracking-widest"
                  />
                </div>

                <div className="border rounded-lg bg-muted/10 overflow-hidden flex-1">
                  <div className="max-h-[55vh] overflow-auto">
                    <Table>
                      <TableHeader className="bg-primary/10 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-[9px] uppercase font-bold">Model</TableHead>
                          <TableHead className="text-[9px] uppercase font-bold">Position</TableHead>
                          <TableHead className="w-[80px] text-[9px] uppercase font-bold text-center">QTY</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {locationResults.length > 0 ? (
                          locationResults.map((item) => (
                            <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                              <TableCell className="font-bold text-[11px] text-white/90 py-3">{item.model}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[9px] font-bold uppercase px-2 py-0.5">
                                  <MapPin className="mr-1 w-2.5 h-2.5" /> {item.locationName}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-medium text-[11px] text-primary">{item.quantity}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-64 text-center">
                              <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                                <Search className="w-10 h-10" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white">No Results Found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center border-t border-white/5 bg-black/40">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-40">
          © {new Date().getFullYear()} ASHLEY STAFF SYSTEM | ستافی ئاشلی
        </p>
      </footer>
    </div>
  );
}
