'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Save,
  Palette,
  ShieldCheck,
  ImageIcon as ImageIconLucide,
  Languages,
  FileText,
  Loader2,
  X,
  Plus,
  Check,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/use-translation';
import type { AppSettings, ThemeColors } from '@/lib/types';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useAuth } from '@/hooks/use-auth';
import { initialSettings } from '@/context/initial-data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const themes = [
  { name: 'purple', color: 'bg-purple-600', label: 'Corporate Purple' },
  { name: 'blue', color: 'bg-blue-600', label: 'Tech Blue' },
  { name: 'green', color: 'bg-green-600', label: 'Forest Emerald' },
  { name: 'rose', color: 'bg-rose-600', label: 'Elegant Rose' },
  { name: 'amber', color: 'bg-amber-600', label: 'Golden Amber' },
  { name: 'violet', color: 'bg-violet-600', label: 'Royal Violet' },
  { name: 'orange', color: 'bg-orange-600', label: 'Sunset Orange' },
  { name: 'cyan', color: 'bg-cyan-600', label: 'Arctic Cyan' },
  { name: 'indigo', color: 'bg-indigo-600', label: 'Deep Indigo' },
  { name: 'zinc', color: 'bg-zinc-600', label: 'Industrial Zinc' },
  { name: 'crimson', color: 'bg-red-700', label: 'Crimson Power' },
  { name: 'custom', color: 'bg-gradient-to-br from-gray-400 to-gray-800', label: 'Custom Architect' },
];

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</Label>
            <div className="flex items-center gap-2">
                <div 
                    className="w-8 h-8 rounded-lg border shadow-sm shrink-0" 
                    style={{ backgroundColor: `hsl(${value})` }}
                />
                <Input 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    placeholder="e.g. 220 80% 50%"
                    className="h-8 text-xs font-mono"
                />
            </div>
        </div>
    );
}

function SettingsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { settings, setSettings } = useAppContext();
  const { hasPermission } = useAuth();

  const [draftSettings, setDraftSettings] = useState<AppSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  
  const isAdmin = hasPermission('admin:all');

  useEffect(() => {
    if (settings) {
      setDraftSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  useEffect(() => {
    if (JSON.stringify(settings) !== JSON.stringify(draftSettings)) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [settings, draftSettings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, settingKeyPath: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const localUrl = event.target?.result as string;
      if (localUrl) {
        setDraftSettings(prev => {
          const newSettings = JSON.parse(JSON.stringify(prev));
          const keys = settingKeyPath.split('.');
          let current: any = newSettings;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = localUrl;
          return newSettings;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
        await setSettings(draftSettings);
        toast({ title: 'Settings Saved', description: 'Your visual changes have been applied.' });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An error occurred while saving configuration.' });
    } finally {
        setIsSaving(false);
    }
  };

  const updateCustomColor = (mode: 'light' | 'dark', key: keyof ThemeColors, value: string) => {
      setDraftSettings(prev => ({
          ...prev,
          [mode === 'light' ? 'lightThemeColors' : 'darkThemeColors']: {
              ...prev[mode === 'light' ? 'lightThemeColors' : 'darkThemeColors'],
              [key]: value
          }
      }));
  };

  const handleResetToDefault = async () => {
    if (resetConfirmText !== "RESET") return;
    await setSettings(initialSettings);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-24">
      <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="design" className="py-2"><Palette className="mr-2 h-4 w-4" /> {t('design')}</TabsTrigger>
            <TabsTrigger value="images" className="py-2"><ImageIconLucide className="mr-2 h-4 w-4" /> {t('images')}</TabsTrigger>
            <TabsTrigger value="language" className="py-2"><Languages className="mr-2 h-4 w-4" /> {t('language_text')}</TabsTrigger>
            <TabsTrigger value="pdf" className="py-2"><FileText className="mr-2 h-4 w-4" /> {t('pdf_reports')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="py-2"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="design" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Global Theme Architecture</CardTitle>
                <CardDescription>Select a professional preset or design your own unique color identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setDraftSettings(prev => ({ ...prev, selectedTheme: theme.name }))}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-muted/50",
                          draftSettings.selectedTheme === theme.name ? "border-primary bg-primary/5 shadow-inner" : "border-transparent bg-muted/20"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg shadow-md border-2 border-white/20", theme.color)} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-center">{theme.label}</span>
                        {draftSettings.selectedTheme === theme.name && (
                          <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {draftSettings.selectedTheme === 'custom' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-muted/20 rounded-2xl border animate-in zoom-in-95 duration-300">
                          <div className="space-y-6">
                              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Light Mode Architect</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <ColorPicker label="Background" value={draftSettings.lightThemeColors.background} onChange={v => updateCustomColor('light', 'background', v)} />
                                  <ColorPicker label="Frontend Text" value={draftSettings.lightThemeColors.foreground} onChange={v => updateCustomColor('light', 'foreground', v)} />
                                  <ColorPicker label="Primary Accent" value={draftSettings.lightThemeColors.primary} onChange={v => updateCustomColor('light', 'primary', v)} />
                                  <ColorPicker label="Interface Accent" value={draftSettings.lightThemeColors.accent} onChange={v => updateCustomColor('light', 'accent', v)} />
                                  <ColorPicker label="Card Surface" value={draftSettings.lightThemeColors.card} onChange={v => updateCustomColor('light', 'card', v)} />
                                  <ColorPicker label="Title Bar" value={draftSettings.lightThemeColors.titleBar} onChange={v => updateCustomColor('light', 'titleBar', v)} />
                              </div>
                          </div>
                          <div className="space-y-6">
                              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Dark Mode Architect</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <ColorPicker label="Background" value={draftSettings.darkThemeColors.background} onChange={v => updateCustomColor('dark', 'background', v)} />
                                  <ColorPicker label="Frontend Text" value={draftSettings.darkThemeColors.foreground} onChange={v => updateCustomColor('dark', 'foreground', v)} />
                                  <ColorPicker label="Primary Accent" value={draftSettings.darkThemeColors.primary} onChange={v => updateCustomColor('dark', 'primary', v)} />
                                  <ColorPicker label="Interface Accent" value={draftSettings.darkThemeColors.accent} onChange={v => updateCustomColor('dark', 'accent', v)} />
                                  <ColorPicker label="Card Surface" value={draftSettings.darkThemeColors.card} onChange={v => updateCustomColor('dark', 'card', v)} />
                                  <ColorPicker label="Title Bar" value={draftSettings.darkThemeColors.titleBar} onChange={v => updateCustomColor('dark', 'titleBar', v)} />
                              </div>
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle>{t('app_logo')}</CardTitle><CardDescription>{t('app_logo_desc')}</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full h-32 border-2 border-dashed rounded-xl p-2 flex justify-center bg-muted/30">
                      {draftSettings.appLogo && <Image src={draftSettings.appLogo} alt="Logo" fill className="object-contain" unoptimized />}
                    </div>
                    <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'appLogo')} />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle>{t('main_dashboard_background')}</CardTitle><CardDescription>{t('main_dashboard_background_desc')}</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full h-32 border-2 border-dashed rounded-xl overflow-hidden bg-muted/30">
                      {draftSettings.mainBackground && <Image src={draftSettings.mainBackground} alt="Background" fill className="object-cover" unoptimized />}
                    </div>
                    <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'mainBackground')} />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Video className="w-4 h-4"/> Login Portal Media</CardTitle>
                    <CardDescription>Configure the cinematic background and card banner for the login portal.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Background Video URL (Direct .mp4 Only)</Label>
                        <Input 
                            value={draftSettings.loginBackgroundVideo || ''} 
                            onChange={e => setDraftSettings(prev => ({ ...prev, loginBackgroundVideo: e.target.value }))}
                            placeholder="Enter direct .mp4 URL"
                        />
                        <div className="p-3 bg-muted/50 rounded-lg space-y-2 border">
                            <p className="text-[10px] font-bold uppercase text-primary">Pro Tip: Use Firebase Storage</p>
                            <p className="text-[10px] leading-relaxed opacity-70">YouTube links will not work. Upload your video to <strong>Firebase Storage</strong>, Cloudinary, or Imgur, and paste the "Download URL" here for a perfect autoplay background.</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label>Login Card Header Image</Label>
                        <div className="relative w-full h-24 border-2 border-dashed rounded-xl overflow-hidden bg-muted/30">
                            {draftSettings.loginCardUpperImage && <Image src={draftSettings.loginCardUpperImage} alt="Login Header" fill className="object-cover" unoptimized />}
                        </div>
                        <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'loginCardUpperImage')} />
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <Label>{t('login_background')}</Label>
                        <div className="relative w-full h-24 border-2 border-dashed rounded-xl overflow-hidden bg-muted/30">
                            {draftSettings.loginBackground && <Image src={draftSettings.loginBackground} alt="Login Background" fill className="object-cover" unoptimized />}
                        </div>
                        <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'loginBackground')} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                      <CardTitle>{t('dashboard_banner')}</CardTitle>
                      <CardDescription>{t('dashboard_banner_desc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full h-32 border-2 border-dashed rounded-xl overflow-hidden bg-muted/30">
                      {draftSettings.dashboardBanner && <Image src={draftSettings.dashboardBanner} alt="Banner" fill className="object-cover" unoptimized />}
                    </div>
                    <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'dashboardBanner')} />
                    <div className="space-y-2">
                        <Label>{t('banner_height')} (px)</Label>
                        <Input 
                            type="number" 
                            value={draftSettings.dashboardBannerHeight} 
                            onChange={e => setDraftSettings(prev => ({ ...prev, dashboardBannerHeight: parseInt(e.target.value) || 150 }))} 
                        />
                    </div>
                  </CardContent>
                </Card>
            </div>
          </TabsContent>

          <TabsContent value="pdf" className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle>Global Report Headers</CardTitle><CardDescription>Custom images for the upper part of all printed pages.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full h-24 border-2 border-dashed rounded-xl bg-muted/30 overflow-hidden">
                      {draftSettings.printHeaderImage && <Image src={draftSettings.printHeaderImage} alt="Header" fill className="object-contain" unoptimized />}
                    </div>
                    <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'printHeaderImage')} />
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle>Global Report Footers</CardTitle><CardDescription>Custom images for the lower part of all printed pages.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative w-full h-24 border-2 border-dashed rounded-xl bg-muted/30 overflow-hidden">
                      {draftSettings.printFooterImage && <Image src={draftSettings.printFooterImage} alt="Footer" fill className="object-contain" unoptimized />}
                    </div>
                    <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'printFooterImage')} />
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="admin" className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-destructive/20 shadow-sm">
                      <CardHeader className="bg-destructive/5 border-b border-destructive/10">
                          <CardTitle className="text-destructive flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" /> Full Terminal Reset
                          </CardTitle>
                          <CardDescription>Permanently wipe all application data and return to initial factory state.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                          <p className="text-xs text-muted-foreground italic">This action is irreversible. All employees, reports, themes, and images will be permanently deleted.</p>
                          <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Verification</Label>
                              <Input 
                                value={resetConfirmText} 
                                onChange={e => setResetConfirmText(e.target.value)} 
                                placeholder="Type RESET to confirm"
                                className="border-destructive/30 focus-visible:ring-destructive"
                              />
                          </div>
                      </CardContent>
                      <CardFooter>
                          <Button variant="destructive" className="w-full font-black uppercase tracking-widest" disabled={resetConfirmText !== "RESET"} onClick={handleResetToDefault}>
                            Reset Terminal
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50 flex justify-center animate-in slide-in-from-bottom-full duration-500">
          <div className="w-full max-w-4xl flex items-center justify-between gap-4">
              <div className="hidden md:block">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                      {isDirty ? "Configuration pending save..." : "All settings synchronized."}
                  </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button variant="ghost" size="sm" className="flex-1 md:flex-none" onClick={() => setDraftSettings(settings)} disabled={!isDirty || isSaving}>
                      <X className="mr-2 h-3.5 w-3.5" /> Discard
                  </Button>
                  <Button className="flex-1 md:flex-none shadow-xl px-12 h-10 font-bold" onClick={handleSave} disabled={!isDirty || isSaving || !isAdmin}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {t('save_all_changes')}
                  </Button>
              </div>
          </div>
      </footer>
    </div>
  );
}

export default withAuth(SettingsPage);
