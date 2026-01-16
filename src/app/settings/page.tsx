
"use client"

import * as React from 'react';
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, Upload, Save, Palette, Type, ShieldCheck, ImageIcon, LayoutDashboard, RefreshCcw, Play, Newspaper, Building, FileText, Receipt, CreditCard, Languages, Search, LogIn, Image as ImageIconLucide } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { useTheme } from '@/components/shared/theme-provider'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from '@/components/ui/slider'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useTranslation } from '@/hooks/use-translation'
import { ReportPdfHeader } from '@/components/reports/report-pdf-header'
import { TransferPdfCard } from '@/components/transmit/transfer-pdf-card'
import { EmployeePdfCard } from '@/components/employees/employee-pdf-card'
import type { PdfSettings, AllPdfSettings, Employee, Transfer, ThemeColors, AppSettings } from '@/lib/types';
import { format, formatISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LanguageContext, Translations } from '@/context/language-provider';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { initialSettings } from '@/context/initial-data';
import { getAllDataForExport, importData } from '@/hooks/use-local-storage';
import { useStorage } from '@/firebase';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

const reportTypes = [
  { value: 'general', label: 'General' },
  { value: 'expense', label: 'Expense' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'withdrawal', label: 'Withdrawal' }
];

// Mock data for previews
const mockEmployee: Employee = {
    id: 'preview-123',
    name: 'John Doe',
    employeeId: 'EMP-007',
    role: 'Manager',
    photoUrl: 'https://picsum.photos/seed/johndoe/400',
    email: 'john.doe@example.com',
    phone: '555-1234',
    employmentStartDate: '2022-01-15T00:00:00.000Z',
    dateOfBirth: '1985-05-20T00:00:00.000Z'
};

const mockTransfer: Transfer = {
    id: 'transfer-prev-123',
    transferDate: formatISO(new Date()),
    cargoName: "Preview Cargo to Erbil",
    destinationCity: "Erbil",
    driverName: "Driver Name",
    warehouseManagerName: "Manager Name",
    itemIds: ['item1', 'item2', 'item3']
};

const mockTransferItems = [
    { model: 'Sofa Model X', quantity: 1, notes: 'Handle with care' },
    { model: 'Dining Table', quantity: 1, notes: '' },
    { model: 'Chair Model Y', quantity: 4, notes: 'Packed separately' },
];

function parseHsl(hsl: string): { h: string, s: string, l: string } {
    if (typeof hsl !== 'string' || hsl.split(' ').length !== 3) {
        const [h, s, l] = '0 0% 0%'.replace(/%/g, '').split(' ').map(s => s.trim());
        return { h, s, l };
    }
    const [h, s, l] = hsl.replace(/%/g, '').split(' ').map(s => s.trim());
    return { h, s, l };
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) {
  const { t } = useTranslation();
  const {h, s, l} = parseHsl(value);

  const handleHslChange = (part: 'h' | 's' | 'l', newValue: string) => {
    const current = parseHsl(value);
    current[part] = newValue;
    onChange(`${current.h} ${current.s}% ${current.l}%`);
  };
  
  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return `#${[0, 8, 4].map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0')).join('')}`;
  }
  
  const handleHexChange = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue = 0, sat = 0, light = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
        case g: hue = (b - r) / d + 2; break;
        case b: hue = (r - g) / d + 4; break;
      }
      hue /= 6;
    }
    hue = Math.round(hue * 360);
    sat = Math.round(sat * 100);
    light = Math.round(light * 100);
    onChange(`${hue} ${sat}% ${light}%`);
  }

  return (
    <div className="flex items-center justify-between">
      <Label className="capitalize text-sm">{t(label.toLowerCase().replace(/ /g,'_'))}</Label>
      <div className='flex items-center gap-2'>
        <Input 
          type="color" 
          value={hslToHex(Number(h), Number(s), Number(l))}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-8 h-8 p-1 rounded-md"
        />
        <div className="flex items-center gap-1 text-xs">
           <Input className="h-7 w-14 text-xs" placeholder="H" value={h} onChange={e => handleHslChange('h', e.target.value)} />
           <Input className="h-7 w-12 text-xs" placeholder="S" value={s} onChange={e => handleHslChange('s', e.target.value)} />
           <Input className="h-7 w-12 text-xs" placeholder="L" value={l} onChange={e => handleHslChange('l', e.target.value)} />
        </div>
      </div>
    </div>
  );
}


function LoginTextEditor() {
    const { t } = useTranslation();
    const langContext = React.useContext(LanguageContext);

    const [loginTitleEn, setLoginTitleEn] = React.useState(langContext?.translations.en.login_title || '');
    const [loginDescEn, setLoginDescEn] = React.useState(langContext?.translations.en.login_description || '');
    const [loginTitleKu, setLoginTitleKu] = React.useState(langContext?.translations.ku.login_title || '');
    const [loginDescKu, setLoginDescKu] = React.useState(langContext?.translations.ku.login_description || '');
    
    React.useEffect(() => {
        if(langContext) {
            langContext.setTranslations('en', { ...langContext.translations.en, login_title: loginTitleEn, login_description: loginDescEn });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginTitleEn, loginDescEn]);
    
    React.useEffect(() => {
        if(langContext) {
            langContext.setTranslations('ku', { ...langContext.translations.ku, login_title: loginTitleKu, login_description: loginDescKu });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginTitleKu, loginDescKu]);


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LogIn /> Login Page Text</CardTitle>
                <CardDescription>Customize the title and description on the login screen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">English</h3>
                    <div className="space-y-2">
                        <Label htmlFor="login-title-en">Login Title</Label>
                        <Input id="login-title-en" value={loginTitleEn} onChange={(e) => setLoginTitleEn(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="login-desc-en">Login Description</Label>
                        <Input id="login-desc-en" value={loginDescEn} onChange={(e) => setLoginDescEn(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">Kurdish</h3>
                    <div className="space-y-2">
                        <Label htmlFor="login-title-ku">Sernivîsa Têketinê</Label>
                        <Input id="login-title-ku" value={loginTitleKu} onChange={(e) => setLoginTitleKu(e.target.value)} dir="rtl"/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="login-desc-ku">Danasîna Têketinê</Label>
                        <Input id="login-desc-ku" value={loginDescKu} onChange={(e) => setLoginDescKu(e.target.value)} dir="rtl"/>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TranslationEditor() {
    const { t } = useTranslation();
    const langContext = React.useContext(LanguageContext);
    const { settings, setSettings } = useAppContext();
    
    const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (loadEvent) => {
            const result = loadEvent.target?.result as string;
            setSettings({ ...settings, customFont: result });
          }
          reader.readAsDataURL(file)
        }
    };

    if (!langContext || !settings) return null;

    const { translations, setTranslations } = langContext;
    const [enTranslations, setEnTranslations] = useState<Translations>(translations.en);
    const [kuTranslations, setKuTranslations] = useState<Translations>(translations.ku);
    const [search, setSearch] = useState('');

    useEffect(() => {
        setEnTranslations(translations.en);
        setKuTranslations(translations.ku);
    }, [translations]);

    const handleSaveTranslations = () => {
        setTranslations('en', enTranslations);
        setTranslations('ku', kuTranslations);
    };

    useEffect(handleSaveTranslations, [enTranslations, kuTranslations, setTranslations]);
    
    const filteredKeys = Object.keys(enTranslations).filter(key => 
        !['login_title', 'login_description'].includes(key) &&
        (
            key.toLowerCase().includes(search.toLowerCase()) || 
            enTranslations[key].toLowerCase().includes(search.toLowerCase()) ||
            (kuTranslations[key] && kuTranslations[key].toLowerCase().includes(search.toLowerCase()))
        )
    ).sort();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Languages /> {t('language_text')}</CardTitle>
                <CardDescription>{t('language_text_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Type /> {t('custom_app_font')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="font-upload">{t('upload_font_file')}</Label>
                            <Input id="font-upload" type="file" accept=".ttf,.woff,.woff2" onChange={handleFontUpload} />
                        </div>
                        {settings.customFont && (
                            <div className="space-y-2">
                                <Label>{t('font_preview')}</Label>
                                 <div className="p-4 border rounded-lg" style={{ fontFamily: 'CustomAppFont, sans-serif' }}>
                                    <style>{`@font-face { font-family: 'CustomAppFont'; src: url(${settings.customFont}); }`}</style>
                                    <p className="text-lg">The quick brown fox jumps over the lazy dog.</p>
                                    <p className="text-lg" dir="rtl">چۆنی باشی؟ سوپاس بۆ تۆ، من باشم.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                 <div className="flex gap-4">
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search keys or values..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                 <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4">
                    <div className="grid grid-cols-[1fr_2fr_2fr] gap-x-4 gap-y-2 sticky top-0 bg-background pb-2 border-b mb-2">
                        <Label className="font-semibold">Key</Label>
                        <Label className="font-semibold">English</Label>
                        <Label className="font-semibold">Kurdish</Label>
                    </div>
                    <div className="space-y-3">
                    {filteredKeys.map(key => (
                        <div key={key} className="grid grid-cols-[1fr_2fr_2fr] gap-x-4 items-center">
                            <Label htmlFor={`key-${key}`} className="text-xs text-muted-foreground truncate">{key}</Label>
                            <Input
                                id={`en-${key}`}
                                value={enTranslations[key] || ''}
                                onChange={(e) => setEnTranslations(p => ({...p, [key]: e.target.value}))}
                            />
                             <Input
                                id={`ku-${key}`}
                                value={kuTranslations[key] || ''}
                                onChange={(e) => setKuTranslations(p => ({...p, [key]: e.target.value}))}
                                dir="rtl"
                            />
                        </div>
                    ))}
                    </div>
                 </div>
            </CardContent>
        </Card>
    );
}

function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation();
  const { settings, setSettings } = useAppContext();
  const storage = useStorage();

  const [localSettings, setLocalSettings] = useState<AppSettings>(initialSettings);
  const [activePdfTab, setActivePdfTab] = useState<'report' | 'invoice' | 'card'>('report');
  const [selectedReportType, setSelectedReportType] = useState<keyof NonNullable<AllPdfSettings['report']['reportColors']>>('general');
  const [importFile, setImportFile] = useState<File | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const applyColors = (colors: ThemeColors) => {
    const root = document.documentElement;
    if (!colors) return;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      if (key && value) {
        root.style.setProperty(cssVar, value);
      }
    });
  };

  useEffect(() => {
    setMounted(true)
  }, []);

  useEffect(() => {
    if (mounted && localSettings) {
      if (theme === 'dark') {
        applyColors(localSettings.darkThemeColors);
      } else {
        applyColors(localSettings.lightThemeColors);
      }
    }
  }, [localSettings?.lightThemeColors, localSettings?.darkThemeColors, theme, mounted, localSettings]);

  const handleLocalSettingChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleThemeColorChange = (mode: 'light' | 'dark', property: keyof ThemeColors, value: string) => {
      const themeKey = mode === 'light' ? 'lightThemeColors' : 'darkThemeColors';
      setLocalSettings(prev => ({
          ...prev,
          [themeKey]: {
              ...prev[themeKey],
              [property]: value
          }
      }));
  };

  const handlePdfSettingChange = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    setLocalSettings(prev => ({
        ...prev,
        pdfSettings: {
            ...prev.pdfSettings,
            [activePdfTab]: {
                ...prev.pdfSettings[activePdfTab],
                [key]: value
            }
        }
    }));
  };
  
  const handleReportColorChange = (reportType: keyof NonNullable<AllPdfSettings['report']['reportColors']>, color: string) => {
    setLocalSettings(prev => ({
        ...prev,
        pdfSettings: {
            ...prev.pdfSettings,
            report: {
                ...prev.pdfSettings.report,
                reportColors: {
                    ...(prev.pdfSettings.report.reportColors),
                    [reportType]: color,
                }
            }
        }
    }));
  };
  
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    filePath: string,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { id: toastId, dismiss } = toast({ title: 'Uploading...', description: 'Please wait while your file is uploaded.' });

    try {
      const sRef = storageRef(storage, filePath);
      
      const reader = new FileReader();
      reader.onload = async (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          await uploadString(sRef, result, 'data_url');
          const downloadURL = await getDownloadURL(sRef);
          onSuccess(downloadURL);
          dismiss(toastId);
          toast({ title: "Upload Complete", description: "Save your settings to see the changes." });
        }
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("File upload failed:", error);
      dismiss(toastId);
      toast({ variant: 'destructive', title: "Upload Failed", description: "There was an error uploading your file." });
    }
  };


  const handleSaveChanges = () => {
    setSettings(localSettings);
    toast({ title: t('settings_saved'), description: t('settings_have_been_updated') });
  };

  const handleResetToDefault = () => {
    setSettings(initialSettings);
    setLocalSettings(initialSettings); // Also reset local state to match
    toast({ title: t('settings_reset'), description: t('settings_reset_desc') });
  };
  
  const handleExport = async () => {
    try {
        const data = await getAllDataForExport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ashley-hr-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: t('data_exported_successfully') });

    } catch (error) {
        console.error("Export failed:", error);
        toast({ variant: 'destructive', title: t('export_failed'), description: t('export_failed_desc') });
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleRunImport = () => {
    if (importFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string);
          await importData(backupData);
          toast({ title: t('data_imported_successfully'), description: t('page_will_reload') });
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error("Import failed:", error);
          toast({ variant: 'destructive', title: t('import_failed'), description: t('invalid_or_corrupted_file') });
        } finally {
            setImportFile(null);
            if(importInputRef.current) importInputRef.current.value = "";
        }
      };
      reader.readAsText(importFile);
    }
  };

  if (!mounted || !localSettings) {
    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/"> <ArrowLeft /> </Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">{t('settings')}</h1>
            </header>
            <div className="flex items-center justify-center">{t('loading')}</div>
        </div>
    );
  }

  const currentPdfSettings = localSettings.pdfSettings[activePdfTab];

  return (
    <div className="min-h-screen bg-background text-foreground">
        <style>{`
            @font-face {
              font-family: 'CustomPdfFont';
              src: ${currentPdfSettings?.customFont ? `url(${currentPdfSettings.customFont})` : 'none'};
            }
        `}</style>
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/"> <ArrowLeft /> </Link>
            </Button>
            <h1 className="text-xl">{t('settings')}</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline">
                        <RefreshCcw className="mr-2 h-4 w-4" /> {t('reset_all_settings')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('reset_all_settings_q')}</AlertDialogTitle>
                        <AlertDialogDescription>
                        {t('reset_all_settings_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetToDefault}>{t('reset_settings')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSaveChanges}>
              <Save className="mr-2 h-4 w-4" /> {t('save_all_changes')}
            </Button>
          </div>
        </div>
      </header>
      <main className="p-4 md:p-6 container mx-auto">
        <Tabs defaultValue="design" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="design"><Palette className="mr-2" />{t('design')}</TabsTrigger>
                <TabsTrigger value="language"><Languages className="mr-2" />{t('language_text')}</TabsTrigger>
                <TabsTrigger value="pdf"><FileText className="mr-2" />{t('pdf_reports')}</TabsTrigger>
                <TabsTrigger value="data"><ShieldCheck className="mr-2" />{t('data_management')}</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette /> {t('general')}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="dark-mode">{t('dark_mode')}</Label>
                                <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logo-upload">{t('company_logo')}</Label>
                                <Input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload(e, `settings/appLogo.png`, (url) => handleLocalSettingChange('appLogo', url))} />
                                {localSettings.appLogo && (
                                    <div className="mt-4">
                                        <Label>Logo Preview</Label>
                                        <div className="relative w-full h-24 mt-2 border rounded-md p-2 flex justify-center items-center bg-muted/30">
                                            <Image key={localSettings.appLogo} src={localSettings.appLogo} alt="Logo Preview" fill className="object-contain" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><LayoutDashboard /> {t('dashboard')}</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="w-full h-24 border rounded-md flex items-center justify-center bg-muted/30 relative overflow-hidden">
                                {localSettings.dashboardBanner ? <Image key={localSettings.dashboardBanner} src={localSettings.dashboardBanner} alt="Current Dashboard Banner" fill={true} className="object-cover" /> : <span className='text-sm text-muted-foreground'>{t('dashboard_banner_preview')}</span>}
                            </div>
                            <div>
                                <Label htmlFor="banner-upload">{t('upload_dashboard_banner')}</Label>
                                <Input id="banner-upload" type="file" accept="image/*" className="mt-2" onChange={(e) => handleFileUpload(e, `settings/dashboardBanner.png`, (url) => handleLocalSettingChange('dashboardBanner', url))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="banner-height">{t('banner_height')}: {localSettings.dashboardBannerHeight}px</Label>
                                <Slider id="banner-height" min={80} max={300} step={10} value={[localSettings.dashboardBannerHeight]} onValueChange={(value) => handleLocalSettingChange('dashboardBannerHeight', value[0])} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><LogIn /> Login Page</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="w-full h-24 border rounded-md flex items-center justify-center bg-muted/30 relative overflow-hidden">
                                {localSettings.loginBackground ? <Image key={localSettings.loginBackground} src={localSettings.loginBackground} alt="Current Login Background" fill={true} className="object-cover" /> : <span className='text-sm text-muted-foreground'>Login Background Preview</span>}
                            </div>
                            <div>
                                <Label htmlFor="login-bg-upload">Upload Login Background</Label>
                                <Input id="login-bg-upload" type="file" accept="image/*" className="mt-2" onChange={(e) => handleFileUpload(e, `settings/loginBackground.png`, (url) => handleLocalSettingChange('loginBackground', url))} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ImageIconLucide /> Main Background</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="w-full h-24 border rounded-md flex items-center justify-center bg-muted/30 relative overflow-hidden">
                                {localSettings.mainBackground ? <Image key={localSettings.mainBackground} src={localSettings.mainBackground} alt="Current Main Background" fill={true} className="object-cover" /> : <span className='text-sm text-muted-foreground'>Main Background Preview</span>}
                            </div>
                            <div>
                                <Label htmlFor="main-bg-upload">Upload Main Background</Label>
                                <Input id="main-bg-upload" type="file" accept="image/*" className="mt-2" onChange={(e) => handleFileUpload(e, `settings/mainBackground.png`, (url) => handleLocalSettingChange('mainBackground', url))} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2 xl:col-span-1">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Palette/> {t('color_palette')}</CardTitle><CardDescription>{t('color_palette_desc')}</CardDescription></CardHeader>
                        <CardContent>
                            <Tabs defaultValue="light" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="light">{t('light_mode')}</TabsTrigger>
                                    <TabsTrigger value="dark">{t('dark_mode')}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="light" className="space-y-4 pt-4">
                                    <ColorPicker label="Background" value={localSettings.lightThemeColors.background} onChange={(c) => handleThemeColorChange('light', 'background', c)} />
                                    <ColorPicker label="Foreground" value={localSettings.lightThemeColors.foreground} onChange={(c) => handleThemeColorChange('light', 'foreground', c)} />
                                    <ColorPicker label="Primary" value={localSettings.lightThemeColors.primary} onChange={(c) => handleThemeColorChange('light', 'primary', c)} />
                                    <ColorPicker label="Accent" value={localSettings.lightThemeColors.accent} onChange={(c) => handleThemeColorChange('light', 'accent', c)} />
                                    <ColorPicker label="Card" value={localSettings.lightThemeColors.card} onChange={(c) => handleThemeColorChange('light', 'card', c)} />
                                    <ColorPicker label="Active Tab Background" value={localSettings.lightThemeColors.tabActiveBackground} onChange={(c) => handleThemeColorChange('light', 'tabActiveBackground', c)} />
                                    <ColorPicker label="Active Tab Foreground" value={localSettings.lightThemeColors.tabActiveForeground} onChange={(c) => handleThemeColorChange('light', 'tabActiveForeground', c)} />
                                </TabsContent>
                                    <TabsContent value="dark" className="space-y-4 pt-4">
                                    <ColorPicker label="Background" value={localSettings.darkThemeColors.background} onChange={(c) => handleThemeColorChange('dark', 'background', c)} />
                                    <ColorPicker label="Foreground" value={localSettings.darkThemeColors.foreground} onChange={(c) => handleThemeColorChange('dark', 'foreground', c)} />
                                    <ColorPicker label="Primary" value={localSettings.darkThemeColors.primary} onChange={(c) => handleThemeColorChange('dark', 'primary', c)} />
                                    <ColorPicker label="Accent" value={localSettings.darkThemeColors.accent} onChange={(c) => handleThemeColorChange('dark', 'accent', c)} />
                                    <ColorPicker label="Card" value={localSettings.darkThemeColors.card} onChange={(c) => handleThemeColorChange('dark', 'card', c)} />
                                    <ColorPicker label="Active Tab Background" value={localSettings.darkThemeColors.tabActiveBackground} onChange={(c) => handleThemeColorChange('dark', 'tabActiveBackground', c)} />
                                    <ColorPicker label="Active Tab Foreground" value={localSettings.darkThemeColors.tabActiveForeground} onChange={(c) => handleThemeColorChange('dark', 'tabActiveForeground', c)} />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="language" className="pt-6 space-y-6">
                 <LoginTextEditor />
                 <TranslationEditor />
            </TabsContent>

            <TabsContent value="pdf" className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('pdf_template')}</CardTitle>
                                <CardDescription>{t('pdf_template_desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activePdfTab} onValueChange={(v) => setActivePdfTab(v as 'report' | 'invoice' | 'card')} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="report"><FileText className="mr-2"/>{t('report')}</TabsTrigger>
                                        <TabsTrigger value="invoice"><Receipt className="mr-2"/>{t('invoice')}</TabsTrigger>
                                        <TabsTrigger value="card"><CreditCard className="mr-2"/>{t('id_card')}</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveChanges} className="w-full">
                                    <Save className="mr-2 h-4 w-4" /> {t('save_design')}
                                </Button>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><FileText /> {t('content')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="logo-upload-pdf">{t('company_logo')}</Label>
                                    <Input id="logo-upload-pdf" type="file" accept="image/*" onChange={(e) => handleFileUpload(e, `settings/pdf/${activePdfTab}_logo.png`, (url) => handlePdfSettingChange('logo', url))} />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="header-text">{t('header_text_optional')}</Label>
                                <Input id="header-text" value={currentPdfSettings.headerText} onChange={(e) => handlePdfSettingChange('headerText', e.target.value)} placeholder="e.g. Confidential Document"/>
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="footer-text">{t('footer_text_optional')}</Label>
                                <Input id="footer-text" value={currentPdfSettings.footerText} onChange={(e) => handlePdfSettingChange('footerText', e.target.value)} placeholder="e.g. Generated by Ashley DRP"/>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Palette /> {t('styling')}</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {activePdfTab === 'report' ? (
                                    <div className="space-y-4">
                                        <CardDescription>{t('report_color_desc')}</CardDescription>
                                        <div className="space-y-2">
                                            <Label htmlFor="report-type-select">{t('report_section')}</Label>
                                            <Select value={selectedReportType} onValueChange={(v: keyof NonNullable<AllPdfSettings['report']['reportColors']>) => setSelectedReportType(v)}>
                                                <SelectTrigger id="report-type-select">
                                                    <SelectValue placeholder="Select a report type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {reportTypes.map(type => (
                                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="theme-color">{t('theme_color')}</Label>
                                            <Input 
                                                id="theme-color" 
                                                type="color"
                                                value={localSettings.pdfSettings.report.reportColors?.[selectedReportType] ?? '#000000'}
                                                onChange={(e) => handleReportColorChange(selectedReportType, e.target.value)} 
                                                className="w-10 h-10 p-1" 
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="theme-color">{t('theme_color')}</Label>
                                        <Input id="theme-color" type="color" value={currentPdfSettings.themeColor} onChange={(e) => handlePdfSettingChange('themeColor', e.target.value)} className="w-10 h-10 p-1" />
                                    </div>
                                )}
                                {(activePdfTab === 'report' || activePdfTab === 'invoice') && (
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="table-theme-select">{t('table_theme')}</Label>
                                        <Select value={currentPdfSettings.tableTheme} onValueChange={(v: 'striped' | 'grid') => handlePdfSettingChange('tableTheme', v)}>
                                            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="striped">{t('striped')}</SelectItem>
                                                <SelectItem value="grid">{t('grid')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>{t('live_preview')}</CardTitle><CardDescription>{t('live_preview_desc', {type: activePdfTab})}</CardDescription></CardHeader>
                            <CardContent className='bg-muted/50 p-6 rounded-b-lg flex justify-center items-start overflow-auto'>
                                <div className="w-full max-w-2xl bg-white shadow-lg transform origin-top overflow-hidden flex flex-col scale-[0.8]" style={{ aspectRatio: '1 / 1.4142' }}>
                                {activePdfTab === 'report' && (
                                    <>
                                        <ReportPdfHeader title="Example Report Title" subtitle="This is an example subtitle" logoSrc={currentPdfSettings.logo ?? null} themeColor={localSettings.pdfSettings.report.reportColors?.[selectedReportType]} headerText={currentPdfSettings.headerText} />
                                        <div className="p-6 flex-grow" style={{fontFamily: 'CustomPdfFont'}}>
                                            <h3 className="font-bold text-gray-800 mb-2">{t('sample_section')}</h3>
                                            <p className="text-sm text-gray-600 mb-4">{t('sample_body_text')}</p>
                                             <Table className={cn(currentPdfSettings.tableTheme === 'grid' && 'border')}>
                                                <TableHeader>
                                                    <TableRow style={{backgroundColor: localSettings.pdfSettings.report.reportColors?.[selectedReportType], color: 'white'}} className="hover:bg-primary/90">
                                                        <TableHead className="text-white">{t('column_1')}</TableHead>
                                                        <TableHead className="text-white">{t('column_2')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                     <TableRow className={cn(currentPdfSettings.tableTheme === 'striped' && 'odd:bg-muted/50')}><TableCell>Data A1</TableCell><TableCell>Data A2</TableCell></TableRow>
                                                     <TableRow className={cn(currentPdfSettings.tableTheme === 'striped' && 'odd:bg-muted/50')}><TableCell>Data B1</TableCell><TableCell>Data B2</TableCell></TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                        {currentPdfSettings.footerText && <div className="mt-auto p-4 border-t text-center text-xs text-gray-500">{currentPdfSettings.footerText}</div>}
                                    </>
                                )}
                                {activePdfTab === 'invoice' && (
                                    <div className="flex flex-col h-full text-black">
                                        <div className="p-1">
                                            <TransferPdfCard
                                                transfer={mockTransfer}
                                                logoSrc={currentPdfSettings.logo}
                                                totalItems={mockTransfer.itemIds.length}
                                            />
                                        </div>
                                        <div className='p-6 flex-grow' style={{fontFamily: 'CustomPdfFont'}}>
                                            <Table className={cn(currentPdfSettings.tableTheme === 'grid' && 'border')}>
                                                <TableHeader>
                                                    <TableRow style={{backgroundColor: currentPdfSettings.themeColor}} className="hover:bg-primary/90">
                                                        <TableHead className="text-white">{t('model')}</TableHead>
                                                        <TableHead className="text-white">{t('quantity')}</TableHead>
                                                        <TableHead className="text-white">{t('notes')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mockTransferItems.map((item, index) => (
                                                        <TableRow key={index} className={cn(currentPdfSettings.tableTheme === 'striped' && 'odd:bg-muted/50')}>
                                                            <TableCell>{item.model}</TableCell>
                                                            <TableCell>{item.quantity}</TableCell>
                                                            <TableCell>{item.notes}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                                {activePdfTab === 'card' && <div className='flex justify-center items-center h-full'><EmployeePdfCard employee={mockEmployee} settings={currentPdfSettings}/></div>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>
            
            <TabsContent value="data" className="pt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck /> {t('data_management')}</CardTitle>
                        <CardDescription>{t('data_management_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="">{t('export_data_desc')}</p>
                            <Button onClick={handleExport} variant="outline"><Download className="mr-2 h-4 w-4" /> {t('export_data')}</Button>
                        </div>
                        <div className="p-4 border rounded-lg space-y-4">
                            <p className="">{t('import_data_title')}</p>
                            <p className="text-sm text-destructive">{t('import_data_warning')}</p>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Input type="file" ref={importInputRef} className="max-w-xs" accept=".json" onChange={handleImportFileSelect} />
                                <Button onClick={handleRunImport} disabled={!importFile}><Play className="mr-2 h-4 w-4" /> {t('run_import')}</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default withAuth(SettingsPage);
