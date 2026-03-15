
'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import {
  Save,
  Palette,
  ShieldCheck,
  ImageIcon as ImageIconLucide,
  Languages,
  FileText,
  Loader2,
  Users,
  RefreshCcw,
  Monitor,
  X,
  Check,
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
import type { AppSettings } from '@/lib/types';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useAuth } from '@/hooks/use-auth';
import { initialSettings } from '@/context/initial-data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const themes = [
  { name: 'purple', color: 'bg-purple-600', label: 'Corporate Purple (Default)' },
  { name: 'blue', color: 'bg-blue-600', label: 'Tech Blue' },
  { name: 'green', color: 'bg-green-600', label: 'Nature Green' },
  { name: 'dark', color: 'bg-zinc-900', label: 'Obsidian Dark' },
];

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
        toast({ title: 'Settings Saved', description: 'Your changes have been applied.' });
    } catch (err) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An error occurred while saving.' });
    } finally {
        setIsSaving(false);
    }
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" /> {t('design')}</TabsTrigger>
            <TabsTrigger value="images" className="hidden lg:flex"><ImageIconLucide className="mr-2 h-4 w-4" /> {t('images')}</TabsTrigger>
            <TabsTrigger value="language"><Languages className="mr-2 h-4 w-4" /> {t('language_text')}</TabsTrigger>
            <TabsTrigger value="pdf"><FileText className="mr-2 h-4 w-4" /> {t('pdf_reports')}</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="design" className="pt-6 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Global Theme Settings</CardTitle>
                <CardDescription>Select a professional preset to overhaul the terminal's appearance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.name}
                        onClick={() => setDraftSettings(prev => ({ ...prev, selectedTheme: theme.name }))}
                        className={cn(
                          "relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all hover:bg-muted/50",
                          draftSettings.selectedTheme === theme.name ? "border-primary bg-primary/5 shadow-inner" : "border-transparent"
                        )}
                      >
                        <div className={cn("w-16 h-16 rounded-2xl shadow-lg border-4 border-white/20", theme.color)} />
                        <span className="text-xs font-bold uppercase tracking-widest text-center">{theme.label}</span>
                        {draftSettings.selectedTheme === theme.name && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="pt-6 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader><CardTitle>{t('app_logo')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-full h-24 border rounded-xl p-2 flex justify-center bg-muted/30">
                  {draftSettings.appLogo && <Image src={draftSettings.appLogo} alt="Logo" fill className="object-contain" unoptimized />}
                </div>
                <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'appLogo')} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="pt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-destructive/20 shadow-sm">
                      <CardHeader className="bg-destructive/5 border-b border-destructive/10">
                          <CardTitle className="text-destructive flex items-center gap-2">
                              <RefreshCcw className="h-4 w-4" /> Full Terminal Reset
                          </CardTitle>
                          <CardDescription>Permanently wipe all application data.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                          <p className="text-xs text-muted-foreground">This action is irreversible. Type <strong>RESET</strong> below to confirm.</p>
                          <Input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)} placeholder="Type RESET" />
                      </CardContent>
                      <CardFooter>
                          <Button variant="destructive" className="w-full font-bold" disabled={resetConfirmText !== "RESET"} onClick={handleResetToDefault}>
                            Reset Now
                          </Button>
                      </CardFooter>
                  </Card>
              </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-50 flex justify-center">
          <div className="w-full max-w-4xl flex items-center justify-between gap-4">
              <div className="hidden md:block">
                  <p className="text-sm font-medium text-muted-foreground opacity-60">
                      {isDirty ? "Configuration pending save..." : "All settings synchronized."}
                  </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setDraftSettings(settings)} disabled={!isDirty || isSaving}>
                      Discard
                  </Button>
                  <Button className="flex-1 md:flex-none shadow-lg px-12" onClick={handleSave} disabled={!isDirty || isSaving || !isAdmin}>
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
