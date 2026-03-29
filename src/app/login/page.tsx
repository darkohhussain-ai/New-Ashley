'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Search, ListChecks, Lock, User } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent } from '@/components/ui/card';

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
      toast({ title: 'Access Granted', description: 'Welcome back!' });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Invalid credentials. Please try again.',
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
    <div className="relative min-h-screen w-full flex bg-background overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        {settings.loginBackgroundEmbed ? (
          <div className="relative w-full h-full overflow-hidden">
            <iframe
              key={backgroundEmbedSrc}
              src={backgroundEmbedSrc}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] border-0"
              allow="autoplay; encrypted-media"
              title="Background Video"
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          </div>
        ) : settings.loginBackground ? (
          <>
            <Image
              key={settings.loginBackground}
              src={settings.loginBackground}
              alt="Login background"
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-fade-in-down">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center mb-8">
            {settings.appLogo && (
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-card rounded-2xl shadow-soft" />
                <div className="relative w-full h-full p-2.5">
                  <Image 
                    src={settings.appLogo} 
                    alt="Logo" 
                    fill 
                    className="object-contain" 
                    unoptimized 
                  />
                </div>
              </div>
            )}
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              ASHLEY STAFF
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Staff Management System
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-soft-lg border-border/30">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your ID"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-sm font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Access Links */}
          <div className="mt-8 space-y-3">
            <p className="text-xs text-center text-muted-foreground uppercase tracking-wider font-medium">
              Quick Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/public-transmit" className="group">
                <Card className="p-4 transition-all duration-200 hover:shadow-soft-lg hover:border-primary/20 cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/15 transition-colors">
                      <ListChecks className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Transmit Lists</p>
                      <p className="text-xs text-muted-foreground mt-0.5">View shipments</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/public-inventory" className="group">
                <Card className="p-4 transition-all duration-200 hover:shadow-soft-lg hover:border-primary/20 cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/15 transition-colors">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Inventory</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Check stock</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          {new Date().getFullYear()} Ashley Staff System
        </p>
      </footer>
    </div>
  );
}
