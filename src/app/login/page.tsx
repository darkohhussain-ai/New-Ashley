
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

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
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password.',
      });
    }
  };

  return (
     <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-black">
        {/* Background Layer: Embed, Video, or Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
            {settings.loginBackgroundEmbed ? (
                <div className="absolute inset-0 w-full h-full pointer-events-none scale-110">
                    <iframe
                        key={settings.loginBackgroundEmbed}
                        src={settings.loginBackgroundEmbed}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media"
                        title="Background Video"
                    />
                </div>
            ) : settings.loginBackgroundVideo ? (
                <video
                    key={settings.loginBackgroundVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src={settings.loginBackgroundVideo} type="video/mp4" />
                </video>
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
                <div className="absolute inset-0 bg-muted" />
            )}
        </div>

        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[1]" />

        <Card className="relative z-10 w-full max-w-sm border-2 border-primary shadow-2xl bg-background/95 backdrop-blur-md overflow-hidden">
            {settings.loginCardUpperImage && (
                <div className="relative w-full h-32 shadow-xl border-b border-white/10">
                    <Image
                        src={settings.loginCardUpperImage}
                        alt="Card Header"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 to-transparent" />
                </div>
            )}
            <CardHeader className="items-center text-center pb-2 pt-6">
                {settings.appLogo && (
                    <div className="relative w-20 h-20 mb-4 bg-white/10 rounded-2xl p-2 backdrop-blur-sm border border-white/20 shadow-xl">
                        <Image
                            key={settings.appLogo}
                            src={settings.appLogo}
                            alt="App Logo"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                )}
                <CardTitle className="text-xl font-black tracking-tighter uppercase text-primary">
                    Ashley Staff
                </CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-[0.2em] opacity-70">
                    Warehouse Manager
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest opacity-60">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Terminal ID"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                            className="bg-muted/50 border-primary/10 focus-visible:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest opacity-60">Security Key</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="bg-muted/50 border-primary/10 focus-visible:ring-primary"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full !mt-8 shadow-lg font-bold uppercase tracking-widest transition-all hover:scale-[1.02]" 
                        disabled={isLoading}
                        style={{ backgroundColor: settings.loginButtonColor ? `hsl(${settings.loginButtonColor})` : undefined }}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Initiate Login"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
