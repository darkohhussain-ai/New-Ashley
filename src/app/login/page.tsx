
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Building2, Search, User, Mail, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { settings, itemCategories } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

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
    { name: 'Erbil', code: 'EBL-01', desc: 'Main Logistics Hub & Distribution Center' },
    { name: 'Baghdad', code: 'BGW-02', desc: 'Central Operations & Inventory Node' },
    { name: 'Diwaniyah', code: 'DWN-03', desc: 'Regional Warehouse & Transit Station' },
    { name: 'Duhok', code: 'DHK-04', desc: 'Northern Gateway & Cargo Terminal' }
  ];

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
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12">
        
        {/* HERO INTRO */}
        <section className="text-center space-y-4 pt-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[10px] bg-primary/5">
            Operational Integrity
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
            Enterprise Resource <span className="text-primary not-italic">Management</span>
          </h2>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-gray-300 font-medium leading-relaxed opacity-80">
            Unified logistics, financial synchronization, and warehouse intelligence for high-performance corporate environments.
          </p>
        </section>

        {/* SECTION 1: BRANCHES */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">Global Branch Nodes</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.map((branch, i) => (
              <Card key={branch.name} className="bg-card/68 backdrop-blur-md border-primary/10 hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Building2 className="w-5 h-5 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[9px] font-mono text-muted-foreground opacity-50">{branch.code}</span>
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-white">{branch.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-muted-foreground leading-snug">{branch.desc}</p>
                </CardContent>
                <div className="h-1 w-0 bg-primary group-hover:w-full transition-all duration-700" />
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 2: WAREHOUSE SEARCH */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">Warehouse Inventory Audit</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          <Card className="bg-card/68 backdrop-blur-md border-primary/20 shadow-2xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-foreground" /> Nexus Quick-Search
              </CardTitle>
              <CardDescription className="text-[10px]">Verify item status across the global inventory architecture.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-widest opacity-60">Item Designation (Name)</Label>
                <Input placeholder="e.g. Luxury Leather Sofa" className="bg-muted/30 border-primary/10 h-10 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-widest opacity-60">System SKU (Code)</Label>
                <Input placeholder="e.g. SKU-9920-X" className="bg-muted/30 border-primary/10 h-10 text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-black tracking-widest opacity-60">Inventory Sector (Category)</Label>
                <Select>
                  <SelectTrigger className="bg-muted/30 border-primary/10 h-10 text-foreground">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="bg-primary/5 p-4 flex justify-end">
              <Button variant="outline" className="font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary hover:text-white transition-all">
                Execute Inventory Query
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* SECTION 3: ABOUT ME */}
        <section className="space-y-6 pb-12">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary whitespace-nowrap">Architect Identity</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          <Card className="bg-card/68 backdrop-blur-md border-white/5 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-4 relative h-64 lg:h-auto bg-muted/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-2xl">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="w-20 h-20 opacity-20" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <Badge className="bg-primary text-white uppercase font-black text-[8px] tracking-widest">System Owner</Badge>
                </div>
              </div>
              <div className="lg:col-span-8 p-8 space-y-6">
                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tighter text-white">Project Engineering <span className="text-primary">Leadership</span></h4>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    This terminal is the culmination of advanced full-stack engineering, designed to bridge the gap between traditional warehouse operations and digital real-time intelligence. Every module is optimized for high-throughput operational environments.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase font-black opacity-40">Direct Contact</p>
                      <p className="text-xs font-bold text-white">architect@ashley-erp.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] uppercase font-black opacity-40">Technical Liaison</p>
                      <p className="text-xs font-bold text-white">+964 (0) 7XX XXX XXXX</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-6 text-center border-t border-white/5 bg-black/40">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted-foreground opacity-40">
          © {new Date().getFullYear()} Ashley Enterprise Logistics • Secured Infrastructure Node
        </p>
      </footer>
    </div>
  );
}
