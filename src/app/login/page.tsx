
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Building2, Search, User, Mail, Smartphone, Truck, MapPin, ListChecks, Inbox, ArrowLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const { t, language } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { settings, transferItems, items, locations } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  // Dialog State
  const [activeTransmissionCity, setActiveTransmissionCity] = useState<string | null>(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      toast({ title: 'Terminal Access Granted', description: 'Welcome back to the ERP Nexus.' });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Invalid credentials. Access denied.',
      });
    }
  };

  const backgroundEmbedSrc = useMemo(() => {
    if (!settings.loginBackgroundEmbed) return '';
    const cleanUrl = settings.loginBackgroundEmbed.split('?')[0];
    const videoId = cleanUrl.split('/').pop();
    return `${cleanUrl}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&disablekb=1`;
  }, [settings.loginBackgroundEmbed]);

  const branches = [
    { name: 'Erbil', code: 'EBL-01', desc: 'Main Logistics Hub & Distribution Center', color: 'border-orange-500/30' },
    { name: 'Baghdad', code: 'BGW-02', desc: 'Central Operations & Inventory Node', color: 'border-blue-500/30' },
    { name: 'Diwan', code: 'DWN-03', desc: 'Regional Warehouse & Transit Station', color: 'border-emerald-500/30' },
    { name: 'Dohuk', code: 'DHK-04', desc: 'Northern Gateway & Cargo Terminal', color: 'border-purple-500/30' }
  ];

  // Logic for Transmission Lists (Staged Items)
  const stagedItemsForCity = useMemo(() => {
    if (!activeTransmissionCity) return [];
    return transferItems.filter(item => !item.transferId && item.destination === activeTransmissionCity);
  }, [transferItems, activeTransmissionCity]);

  // Logic for Location Search
  const locationResults = useMemo(() => {
    if (!locationSearchQuery.trim()) return [];
    const query = locationSearchQuery.toLowerCase();
    return items.filter(item => 
      item.model.toLowerCase().includes(query)
    ).map(item => {
      const loc = locations.find(l => l.id === item.locationId);
      const transferItem = transferItems.find(ti => ti.model.toLowerCase() === item.model.toLowerCase());
      return {
        ...item,
        locationName: loc?.name || 'Unknown',
        invoiceNo: transferItem?.invoiceNo || 'N/A'
      };
    });
  }, [locationSearchQuery, items, locations, transferItems]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-x-hidden">
      {/* BACKGROUND ARCHITECTURE */}
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] z-[1]" />
      </div>

      {/* TOP LOGIN BAR */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.appLogo && (
              <div className="relative w-10 h-10 bg-white rounded-lg p-1 shadow-inner border border-primary/10">
                <Image src={settings.appLogo} alt="Logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <div className="hidden sm:block text-foreground">
              <h1 className="text-sm font-black uppercase tracking-widest text-primary">ERP Nexus</h1>
              <p className="text-[9px] uppercase tracking-tighter opacity-60">Corporate Intelligence</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Input
                type="text"
                placeholder="Terminal ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 w-40 bg-muted/50 border-primary/10 text-xs focus-visible:ring-primary"
                required
              />
              <Input
                type="password"
                placeholder="Security Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-40 bg-muted/50 border-primary/10 text-xs focus-visible:ring-primary"
                required
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="h-9 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg transition-transform active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Access"}
            </Button>
          </form>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col justify-center gap-12">
        
        {/* HERO ACTIONS - CENTERED COMMANDS */}
        <section className="text-center space-y-10 animate-in fade-in slide-in-from-top-4 duration-1000 py-12">
          <div className="space-y-4">
            <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[10px] bg-primary/5">
              Secure Terminal Node
            </Badge>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic">
              LOGISTICS <span className="text-primary not-italic">COMMAND</span>
            </h2>
            <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-300 font-medium leading-relaxed opacity-80">
              High-performance synchronization across the regional warehouse architecture. Access critical transmission lists and inventory positioning.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* TRANSMISSION LISTS DIALOG */}
            <Dialog onOpenChange={(open) => !open && setActiveTransmissionCity(null)}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-16 px-12 bg-primary/20 backdrop-blur-md border border-primary/30 hover:bg-primary/40 text-primary font-black uppercase tracking-widest text-sm shadow-2xl group transition-all hover:scale-105">
                  <ListChecks className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform" />
                  Transmission Lists
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-card/68 backdrop-blur-xl border-primary/20 max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Truck className="w-6 h-6 text-primary" /> 
                    {activeTransmissionCity ? `Transmission: ${activeTransmissionCity}` : "Regional Nodes"}
                  </DialogTitle>
                  <DialogDescription className="text-xs uppercase tracking-widest opacity-60">
                    {activeTransmissionCity ? `Verifying staged cargo for ${activeTransmissionCity} terminal.` : "Select a regional hub to audit pending transmissions."}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden p-6 pt-2 flex flex-col">
                  {!activeTransmissionCity ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                      {["Erbil", "Baghdad", "Diwan", "Dohuk"].map((city) => (
                        <Button 
                          key={city} 
                          variant="outline" 
                          className="h-24 bg-muted/10 border-primary/10 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-between px-8 text-lg font-black uppercase tracking-tighter group"
                          onClick={() => setActiveTransmissionCity(city)}
                        >
                          {city}
                          <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full space-y-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-fit text-[9px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 p-0"
                        onClick={() => setActiveTransmissionCity(null)}
                      >
                        <ArrowLeft className="mr-2 w-3 h-3" /> Back to Nodes
                      </Button>
                      
                      <div className="border rounded-xl bg-muted/10 overflow-hidden flex-1">
                        <div className="max-h-[50vh] overflow-auto scrollbar-none">
                          <Table>
                            <TableHeader className="bg-primary/10 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[50px] text-[9px] uppercase font-black">Audit</TableHead>
                                <TableHead className="text-[9px] uppercase font-black">Model Designation</TableHead>
                                <TableHead className="w-[80px] text-[9px] uppercase font-black text-center">QTY</TableHead>
                                <TableHead className="w-[140px] text-[9px] uppercase font-black">Invoice #</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stagedItemsForCity.length > 0 ? (
                                stagedItemsForCity.map((item) => (
                                  <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                                    <TableCell className="p-4 text-center">
                                      <Checkbox className="border-primary/30 data-[state=checked]:bg-primary" />
                                    </TableCell>
                                    <TableCell className="font-bold text-[11px] text-white/90">{item.model}</TableCell>
                                    <TableCell className="text-center font-mono text-[11px] text-primary">{item.quantity}</TableCell>
                                    <TableCell className="text-[10px] font-mono opacity-60">#{item.invoiceNo || 'STAGING'}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                                      <Inbox className="w-10 h-10" />
                                      <p className="text-[10px] font-black uppercase tracking-widest">No Items Staged for {activeTransmissionCity}</p>
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

            {/* LOCATION SEARCH DIALOG */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="h-16 px-12 bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest text-sm shadow-2xl group transition-all hover:scale-105">
                  <MapPin className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform text-primary" />
                  Location Search
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-card/68 backdrop-blur-xl border-primary/20 max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Search className="w-6 h-6 text-primary" /> Inventory Positioning Audit
                  </DialogTitle>
                  <DialogDescription className="text-[10px] uppercase tracking-widest opacity-60">Identify precise item coordinates across the operational architecture.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 pt-4 flex-1 flex flex-col overflow-hidden">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-60" />
                    <Input 
                      placeholder="ENTER MODEL NAME OR SKU DESIGNATION..." 
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      className="h-14 pl-12 bg-muted/20 border-primary/20 text-xs font-black tracking-widest uppercase focus-visible:ring-primary shadow-inner"
                    />
                  </div>

                  <div className="border rounded-xl bg-muted/10 overflow-hidden flex-1">
                    <div className="max-h-[55vh] overflow-auto scrollbar-none">
                      <Table>
                        <TableHeader className="bg-primary/10 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="text-[9px] uppercase font-black">Model Designation</TableHead>
                            <TableHead className="text-[9px] uppercase font-black">Position</TableHead>
                            <TableHead className="w-[80px] text-[9px] uppercase font-black text-center">QTY</TableHead>
                            <TableHead className="w-[140px] text-[9px] uppercase font-black">Linked Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {locationResults.length > 0 ? (
                            locationResults.map((item) => (
                              <TableRow key={item.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                                <TableCell className="font-bold text-[11px] text-white/90 py-4">{item.model}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[9px] font-black uppercase px-2 py-0.5">
                                    <MapPin className="mr-1 w-2.5 h-2.5" /> {item.locationName}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center font-mono text-[11px] text-primary">{item.quantity}</TableCell>
                                <TableCell className="text-[10px] font-mono opacity-60">#{item.invoiceNo}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                                  <Search className="w-12 h-12" />
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">Audit Sequence Ready</p>
                                    <p className="text-[9px] font-bold opacity-60 uppercase">Enter search parameters to initiate nexus scan.</p>
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
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* BOTTOM SECTION: BRANCHES */}
        <section className="space-y-8 pb-12">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary whitespace-nowrap opacity-60">Regional Operational Nodes</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {branches.map((branch, i) => (
              <Card key={branch.name} className={cn("bg-card/68 backdrop-blur-md border border-white/5 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2 group cursor-default", branch.color)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Building2 className="w-6 h-6 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-mono text-muted-foreground opacity-40">{branch.code}</span>
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-white mt-2">{branch.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-muted-foreground leading-snug font-medium opacity-80">{branch.desc}</p>
                </CardContent>
                <div className="h-1 w-0 bg-primary group-hover:w-full transition-all duration-700" />
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-8 text-center border-t border-white/5 bg-black/40">
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-muted-foreground opacity-30">
          © {new Date().getFullYear()} Ashley Enterprise Logistics • Secured Infrastructure Node
        </p>
      </footer>
    </div>
  );
}
