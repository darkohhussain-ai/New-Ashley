'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Search, ListChecks } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { settings } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

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

      {/* Modern Metal Header Bar */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b-2 border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.appLogo && (
              <div className="relative w-10 h-10 bg-white rounded-lg p-1 border-2 border-white/30 shadow-md">
                <Image src={settings.appLogo} alt="Logo" fill className="object-contain" unoptimized />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-[12px] font-bold uppercase tracking-wider text-primary leading-none">ASHLEY STAFF | ستافی ئاشلی</h1>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Input
                type="text"
                placeholder="ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 w-32 bg-muted/20 border-white/20 text-[11px] placeholder:text-muted-foreground/50"
                required
              />
              <Input
                type="password"
                placeholder="Key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-32 bg-muted/20 border-white/20 text-[11px] placeholder:text-muted-foreground/50"
                required
              />
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="h-9 px-6 font-bold uppercase text-[11px] border-2 border-white/10 hover:border-white/40 transition-all shadow-md"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Access / چوونەژوورەوە"}
            </Button>
          </form>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col justify-center items-center">
        <div className="flex flex-col gap-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
          
          <Link href="/public-transmit" className="w-full">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-24 w-full bg-amber-500/10 backdrop-blur-md border-2 border-white/30 hover:border-white/60 hover:bg-amber-500/20 text-[13px] font-bold uppercase tracking-widest flex flex-col gap-1.5 shadow-2xl transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center gap-2 text-amber-500 group-hover:text-amber-400 transition-colors">
                <ListChecks className="w-6 h-6" />
                Transmission Lists
              </div>
              <span className="text-[11px] font-medium opacity-80 text-white normal-case">لیستی گواستنەوەکان</span>
            </Button>
          </Link>

          <Link href="/public-inventory" className="w-full">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-24 w-full bg-emerald-500/10 backdrop-blur-md border-2 border-white/30 hover:border-white/60 hover:bg-emerald-500/20 text-[13px] font-bold uppercase tracking-widest flex flex-col gap-1.5 shadow-2xl transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center gap-2 text-emerald-500 group-hover:text-emerald-400 transition-colors">
                <Search className="w-6 h-6" />
                Inventory Audit
              </div>
              <span className="text-[11px] font-medium opacity-80 text-white normal-case">پشکنینی کۆگا</span>
            </Button>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center border-t border-white/10 bg-black/40 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          © {new Date().getFullYear()} ASHLEY STAFF SYSTEM | ستافی ئاشلی
        </p>
      </footer>
    </div>
  );
}
