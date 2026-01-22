
      

'use client';

import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Download,
  Upload,
  Save,
  Palette,
  Type,
  ShieldCheck,
  ImageIcon,
  LayoutDashboard,
  RefreshCcw,
  Play,
  Newspaper,
  Building,
  FileText,
  Receipt,
  CreditCard,
  Languages,
  Search,
  LogIn,
  Image as ImageIconLucide,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useTheme } from '@/components/shared/theme-provider';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { ReportWrapper } from '@/components/reports/ReportWrapper';
import { EmployeePdfCard } from '@/components/employees/employee-pdf-card';
import type {
  PdfSettings,
  AllPdfSettings,
  Employee,
  Transfer,
  ThemeColors,
  AppSettings,
  BranchColors,
  ItemForTransfer,
} from '@/lib/types';
import { format, formatISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { LanguageContext, Translations } from '@/context/language-provider';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { initialSettings } from '@/context/initial-data';
import { getAllDataForExport, importData } from '@/hooks/use-local-storage';
import { useStorage } from '@/firebase';
import {
  ref as storageRef,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import { TransmitReportPdf } from '@/components/transmit/TransmitReportPdf';

const reportTypes = [
  { value: 'general', label: 'General' },
  { value: 'expense', label: 'Expense' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'withdrawal', label: 'Withdrawal' },
];

const destinations = ["Erbil", "Baghdad", "Dohuk", "Diwan"];

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
  dateOfBirth: '1985-05-20T00:00:00.000Z',
  isActive: true
};

const mockTransfer: Transfer = {
  id: 'transfer-prev-123',
  transferDate: formatISO(new Date()),
  cargoName: 'Preview Cargo to Erbil',
  destinationCity: 'Erbil',
  driverName: 'Driver Name',
  warehouseManagerName: 'Manager Name',
  itemIds: ['item1', 'item2', 'item3'],
  invoiceNumber: 1,
};

const mockTransferItems: ItemForTransfer[] = [
  { id: '1', model: 'Sofa Model X', quantity: 1, notes: 'Handle with care', destination: 'Erbil', createdAt: new Date().toISOString() },
  { id: '2', model: 'Dining Table', quantity: 1, notes: '', destination: 'Erbil', createdAt: new Date().toISOString() },
  { id: '3', model: 'Chair Model Y', quantity: 4, notes: 'Packed separately', destination: 'Erbil', createdAt: new Date().toISOString(), storage: 'Huana' },
];

function parseHsl(hsl: string): { h: string; s: string; l: string } {
  if (typeof hsl !== 'string' || hsl.split(' ').length !== 3) {
    const [h, s, l] = '0 0% 0%'.replace(/%/g, '').split(' ').map(s => s.trim());
    return { h, s, l };
  }
  const [h, s, l] = hsl.replace(/%/g, '').split(' ').map(s => s.trim());
  return { h, s, l };
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const { h, s, l } = parseHsl(value);

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
    return `#${[0, 8, 4]
      .map(n => Math.round(f(n) * 255).toString(16).padStart(2, '0'))
      .join('')}`;
  };

  const handleHexChange = (hex: string) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let hue = 0,
      sat = 0,
      light = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          hue = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / d + 2;
          break;
        case b:
          hue = (r - g) / d + 4;
          break;
      }
      hue /= 6;
    }
    hue = Math.round(hue * 360);
    sat = Math.round(sat * 100);
    light = Math.round(light * 100);
    onChange(`${hue} ${sat}% ${light}%`);
  };

  return (
    <div className="flex items-center justify-between">
      <Label className="capitalize text-sm">
        {t(label.toLowerCase().replace(/ /g, '_'))}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={hslToHex(Number(h), Number(s), Number(l))}
          onChange={e => handleHexChange(e.target.value)}
          className="w-8 h-8 p-1 rounded-md"
        />
        <div className="flex items-center gap-1 text-xs">
          <Input
            className="h-7 w-14 text-xs"
            placeholder="H"
            value={h}
            onChange={e => handleHslChange('h', e.target.value)}
          />
          <Input
            className="h-7 w-12 text-xs"
            placeholder="S"
            value={s}
            onChange={e => handleHslChange('s', e.target.value)}
          />
          <Input
            className="h-7 w-12 text-xs"
            placeholder="L"
            value={l}
            onChange={e => handleHslChange('l', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function LoginTextEditor() {
  const { t } = useTranslation();
  const langContext = React.useContext(LanguageContext);

  const [loginTitleEn, setLoginTitleEn] = React.useState(
    langContext?.translations.en.login_title || ''
  );
  const [loginDescEn, setLoginDescEn] = React.useState(
    langContext?.translations.en.login_description || ''
  );
  const [loginTitleKu, setLoginTitleKu] = React.useState(
    langContext?.translations.ku.login_title || ''
  );
  const [loginDescKu, setLoginDescKu] = React.useState(
    langContext?.translations.ku.login_description || ''
  );

  React.useEffect(() => {
    if (langContext) {
      langContext.setTranslations('en', {
        ...langContext.translations.en,
        login_title: loginTitleEn,
        login_description: loginDescEn,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginTitleEn, loginDescEn]);

  React.useEffect(() => {
    if (langContext) {
      langContext.setTranslations('ku', {
        ...langContext.translations.ku,
        login_title: loginTitleKu,
        login_description: loginDescKu,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginTitleKu, loginDescKu]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn /> Login Page Text
        </CardTitle>
        <CardDescription>
          Customize the title and description on the login screen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">
            English
          </h3>
          <div className="space-y-2">
            <Label htmlFor="login-title-en">Login Title</Label>
            <Input
              id="login-title-en"
              value={loginTitleEn}
              onChange={e => setLoginTitleEn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-desc-en">Login Description</Label>
            <Input
              id="login-desc-en"
              value={loginDescEn}
              onChange={e => setLoginDescEn(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Kurdish
          </h3>
          <div className="space-y-2">
            <Label htmlFor="login-title-ku">Sernivîsa Têketinê</Label>
            <Input
              id="login-title-ku"
              value={loginTitleKu}
              onChange={e => setLoginTitleKu(e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-desc-ku">Danasîna Têketinê</Label>
            <Input
              id="login-desc-ku"
              value={loginDescKu}
              onChange={e => setLoginDescKu(e.target.value)}
              dir="rtl"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TranslationEditor({ onSave }: { onSave: () => void }) {
  const { t } = useTranslation();
  const langContext = React.useContext(LanguageContext);
  const { settings, setSettings } = useAppContext();

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = loadEvent => {
        const result = loadEvent.target?.result as string;
        setSettings(prev => ({ ...prev, customFont: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!langContext || !settings) return null;

  const { translations, setTranslations } = langContext;
  const [enTranslations, setEnTranslations] =
    useState<Translations>(translations.en);
  const [kuTranslations, setKuTranslations] =
    useState<Translations>(translations.ku);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setEnTranslations(translations.en);
    setKuTranslations(translations.ku);
  }, [translations]);

  const handleSaveTranslations = () => {
    setTranslations('en', enTranslations);
    setTranslations('ku', kuTranslations);
  };

  useEffect(handleSaveTranslations, [
    enTranslations,
    kuTranslations,
    setTranslations,
  ]);

  const filteredKeys = Object.keys(enTranslations)
    .filter(
      key =>
        !['login_title', 'login_description'].includes(key) &&
        (key.toLowerCase().includes(search.toLowerCase()) ||
          enTranslations[key].toLowerCase().includes(search.toLowerCase()) ||
          (kuTranslations[key] &&
            kuTranslations[key].toLowerCase().includes(search.toLowerCase())))
    )
    .sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages /> {t('language_text')}
        </CardTitle>
        <CardDescription>{t('language_text_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type /> {t('custom_app_font')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-upload">{t('upload_font_file')}</Label>
              <Input
                id="font-upload"
                type="file"
                accept=".ttf,.woff,.woff2"
                onChange={handleFontUpload}
              />
            </div>
            {settings.customFont && (
              <div className="space-y-2">
                <Label>{t('font_preview')}</Label>
                <div
                  className="p-4 border rounded-lg"
                  style={{ fontFamily: 'CustomAppFont, sans-serif' }}
                >
                  <style>{`@font-face { font-family: 'CustomAppFont'; src: url(${settings.customFont}); }`}</style>
                  <p className="text-lg">
                    The quick brown fox jumps over the lazy dog.
                  </p>
                  <p className="text-lg" dir="rtl">
                    چۆنی باشی؟ سوپاس بۆ تۆ، من باشم.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={onSave}><Save className="mr-2 h-4 w-4" />{t('save_font')}</Button>
          </CardFooter>
        </Card>
        <div className="flex gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys or values..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
              <div
                key={key}
                className="grid grid-cols-[1fr_2fr_2fr] gap-x-4 items-center"
              >
                <Label
                  htmlFor={`key-${key}`}
                  className="text-xs text-muted-foreground truncate"
                >
                  {key}
                </Label>
                <Input
                  id={`en-${key}`}
                  value={enTranslations[key] || ''}
                  onChange={e =>
                    setEnTranslations(p => ({ ...p, [key]: e.target.value }))
                  }
                />
                <Input
                  id={`ku-${key}`}
                  value={kuTranslations[key] || ''}
                  onChange={e =>
                    setKuTranslations(p => ({ ...p, [key]: e.target.value }))
                  }
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
  const { toast } = useToast();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { settings, setSettings } = useAppContext();
  const storage = useStorage();

  const [draftSettings, setDraftSettings] =
    useState<AppSettings>(initialSettings);
  const [isDirty, setIsDirty] = useState(false);

  const [activePdfTab, setActivePdfTab] = useState<'report' | 'invoice' | 'card'>('report');
  const [selectedReportType, setSelectedReportType] =
    useState<keyof NonNullable<AllPdfSettings['report']['reportColors']>>('general');
  const [importFile, setImportFile] = useState<File | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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
    if (draftSettings) {
      if (theme === 'dark') {
        applyColors(draftSettings.darkThemeColors);
      } else {
        applyColors(draftSettings.lightThemeColors);
      }
    }
  }, [draftSettings?.lightThemeColors, draftSettings?.darkThemeColors, theme, draftSettings]);

  const handleDraftChange = (key: keyof AppSettings, value: any) => {
    setDraftSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleThemeColorChange = (
    mode: 'light' | 'dark',
    property: keyof ThemeColors,
    value: string
  ) => {
    const themeKey =
      mode === 'light' ? 'lightThemeColors' : 'darkThemeColors';
    setDraftSettings(prev => ({
      ...prev,
      [themeKey]: {
        ...prev[themeKey],
        [property]: value,
      },
    }));
  };

  const handlePdfSettingChange = <K extends keyof PdfSettings>(
    key: K,
    value: PdfSettings[K]
  ) => {
    setDraftSettings(prev => ({
      ...prev,
      pdfSettings: {
        ...prev.pdfSettings,
        [activePdfTab]: {
          ...prev.pdfSettings[activePdfTab],
          [key]: value,
        },
      },
    }));
  };

  const handleReportColorChange = (
    reportType: keyof NonNullable<AllPdfSettings['report']['reportColors']>,
    color: string
  ) => {
    setDraftSettings(prev => ({
      ...prev,
      pdfSettings: {
        ...prev.pdfSettings,
        report: {
          ...prev.pdfSettings.report,
          reportColors: {
            ...prev.pdfSettings.report.reportColors,
            [reportType]: color,
          },
        },
      },
    }));
  };

   const handleBranchColorChange = (branch: keyof BranchColors, color: string) => {
    setDraftSettings(prev => ({
      ...prev,
      pdfSettings: {
        ...prev.pdfSettings,
        invoice: {
          ...prev.pdfSettings.invoice,
          branchColors: {
            ...prev.pdfSettings.invoice.branchColors,
            [branch]: color,
          },
        },
      },
    }));
  };


  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    filePath: string,
    settingKeyPath: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const localUrl = event.target?.result as string;
      if (localUrl) {
        // Set state for instant preview
        setDraftSettings(prev => {
          const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation
          const keys = settingKeyPath.split('.');
          let current: any = newSettings;
          for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = localUrl;
          return newSettings;
        });

        // Upload to storage
        const sRef = storageRef(storage, filePath);
        uploadString(sRef, localUrl, 'data_url')
          .then(() => {
            getDownloadURL(sRef)
              .then(downloadURL => {
                // Silently update draft with permanent URL
                setDraftSettings(prev => {
                    const newSettings = JSON.parse(JSON.stringify(prev));
                    const keys = settingKeyPath.split('.');
                    let current: any = newSettings;
                    for (let i = 0; i < keys.length - 1; i++) {
                        current = current[keys[i]];
                    }
                    // Only update if the preview URL is still there
                    if (current[keys[keys.length - 1]] === localUrl) {
                      current[keys[keys.length - 1]] = downloadURL;
                    }
                    return newSettings;
                });
              })
              .catch(err => console.error('Error getting download URL', err));
          })
          .catch(err => {
            console.error('Error uploading file', err);
            toast({
              variant: 'destructive',
              title: 'Upload Failed',
              description: 'Could not upload the image.',
            });
            // Revert on failure? The prompt version doesn't.
          });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSettings(draftSettings);
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been saved.',
    });
  };

  const handleCancel = () => {
    setDraftSettings(settings);
    toast({
      title: 'Cancelled',
      description: 'Your changes have been discarded.',
    });
  };

  const handleResetToDefault = () => {
    setSettings(initialSettings);
    setDraftSettings(initialSettings);
    toast({
      title: t('settings_reset'),
      description: t('settings_reset_desc'),
    });
  };

  const handleExport = async () => {
    try {
      const data = await getAllDataForExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
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
      console.error('Export failed:', error);
      toast({
        variant: 'destructive',
        title: t('export_failed'),
        description: t('export_failed_desc'),
      });
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
      reader.onload = async event => {
        try {
          const backupData = JSON.parse(event.target?.result as string);
          await importData(backupData);
          toast({
            title: t('data_imported_successfully'),
            description: t('page_will_reload'),
          });
          setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
          console.error('Import failed:', error);
          toast({
            variant: 'destructive',
            title: t('import_failed'),
            description: t('invalid_or_corrupted_file'),
          });
        } finally {
          setImportFile(null);
          if (importInputRef.current) importInputRef.current.value = '';
        }
      };
      reader.readAsText(importFile);
    }
  };

  if (!settings || !draftSettings) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              {' '}
              <ArrowLeft />{' '}
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">{t('settings')}</h1>
        </header>
        <div className="flex items-center justify-center flex-1">
          {t('loading')}
        </div>
      </div>
    );
  }

  const currentPdfSettings = draftSettings.pdfSettings[activePdfTab];

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <style>{`
            @font-face {
              font-family: 'CustomPdfFont';
              src: ${
                currentPdfSettings?.customFont
                  ? `url(${currentPdfSettings.customFont})`
                  : 'none'
              };
            }
        `}</style>
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/">
                {' '}
                <ArrowLeft />{' '}
              </Link>
            </Button>
            <h1 className="text-xl">{t('settings')}</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                  {t('reset_all_settings')}
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
                  <AlertDialogAction onClick={handleResetToDefault}>
                    {t('reset_settings')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={!isDirty}>
              <Save className="mr-2 h-4 w-4" /> {t('save_all_changes')}
            </Button>
            <Button onClick={handleCancel} disabled={!isDirty} variant="ghost">
              <X className="mr-2 h-4 w-4" /> {t('cancel')}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 container mx-auto">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="design">
              <Palette className="mr-2" />
              {t('design')}
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="mr-2" />
              {t('images')}
            </TabsTrigger>
            <TabsTrigger value="language">
              <Languages className="mr-2" />
              {t('language_text')}
            </TabsTrigger>
            <TabsTrigger value="pdf">
              <FileText className="mr-2" />
              {t('pdf_reports')}
            </TabsTrigger>
            <TabsTrigger value="data">
              <ShieldCheck className="mr-2" />
              {t('data_management')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette /> {t('general')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="news-ticker-text">News Ticker Text</Label>
                    <Input
                      id="news-ticker-text"
                      value={draftSettings.newsTickerText}
                      onChange={e =>
                        handleDraftChange('newsTickerText', e.target.value)
                      }
                      placeholder="Enter scrolling text for the dashboard..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banner-height">
                      {t('banner_height')}: {draftSettings.dashboardBannerHeight}
                      px
                    </Label>
                    <Slider
                      id="banner-height"
                      min={80}
                      max={300}
                      step={10}
                      value={[draftSettings.dashboardBannerHeight]}
                      onValueChange={value =>
                        handleDraftChange('dashboardBannerHeight', value[0])
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette /> {t('color_palette')}
                  </CardTitle>
                  <CardDescription>{t('color_palette_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="light" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="light">{t('light_mode')}</TabsTrigger>
                      <TabsTrigger value="dark">{t('dark_mode')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="light" className="space-y-4 pt-4">
                      <ColorPicker
                        label="Background"
                        value={draftSettings.lightThemeColors.background}
                        onChange={c =>
                          handleThemeColorChange('light', 'background', c)
                        }
                      />
                      <ColorPicker
                        label="Foreground"
                        value={draftSettings.lightThemeColors.foreground}
                        onChange={c =>
                          handleThemeColorChange('light', 'foreground', c)
                        }
                      />
                      <ColorPicker
                        label="Primary"
                        value={draftSettings.lightThemeColors.primary}
                        onChange={c =>
                          handleThemeColorChange('light', 'primary', c)
                        }
                      />
                      <ColorPicker
                        label="Accent"
                        value={draftSettings.lightThemeColors.accent}
                        onChange={c =>
                          handleThemeColorChange('light', 'accent', c)
                        }
                      />
                      <ColorPicker
                        label="Card"
                        value={draftSettings.lightThemeColors.card}
                        onChange={c => handleThemeColorChange('light', 'card', c)}
                      />
                      <ColorPicker
                        label="Active Tab Background"
                        value={
                          draftSettings.lightThemeColors.tabActiveBackground
                        }
                        onChange={c =>
                          handleThemeColorChange(
                            'light',
                            'tabActiveBackground',
                            c
                          )
                        }
                      />
                      <ColorPicker
                        label="Active Tab Foreground"
                        value={
                          draftSettings.lightThemeColors.tabActiveForeground
                        }
                        onChange={c =>
                          handleThemeColorChange(
                            'light',
                            'tabActiveForeground',
                            c
                          )
                        }
                      />
                    </TabsContent>
                    <TabsContent value="dark" className="space-y-4 pt-4">
                      <ColorPicker
                        label="Background"
                        value={draftSettings.darkThemeColors.background}
                        onChange={c =>
                          handleThemeColorChange('dark', 'background', c)
                        }
                      />
                      <ColorPicker
                        label="Foreground"
                        value={draftSettings.darkThemeColors.foreground}
                        onChange={c =>
                          handleThemeColorChange('dark', 'foreground', c)
                        }
                      />
                      <ColorPicker
                        label="Primary"
                        value={draftSettings.darkThemeColors.primary}
                        onChange={c =>
                          handleThemeColorChange('dark', 'primary', c)
                        }
                      />
                      <ColorPicker
                        label="Accent"
                        value={draftSettings.darkThemeColors.accent}
                        onChange={c =>
                          handleThemeColorChange('dark', 'accent', c)
                        }
                      />
                      <ColorPicker
                        label="Card"
                        value={draftSettings.darkThemeColors.card}
                        onChange={c => handleThemeColorChange('dark', 'card', c)}
                      />
                      <ColorPicker
                        label="Active Tab Background"
                        value={draftSettings.darkThemeColors.tabActiveBackground}
                        onChange={c =>
                          handleThemeColorChange(
                            'dark',
                            'tabActiveBackground',
                            c
                          )
                        }
                      />
                      <ColorPicker
                        label="Active Tab Foreground"
                        value={
                          draftSettings.darkThemeColors.tabActiveForeground
                        }
                        onChange={c =>
                          handleThemeColorChange('dark', 'tabActiveForeground', c)
                        }
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="images" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIconLucide /> {t('app_logo')}
                  </CardTitle>
                  <CardDescription>{t('app_logo_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full h-24 mt-2 border rounded-md p-2 flex justify-center items-center bg-muted/30">
                    {draftSettings.appLogo ? (
                      <Image
                        key={draftSettings.appLogo}
                        src={draftSettings.appLogo}
                        alt="Logo Preview"
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Logo Preview
                      </span>
                    )}
                  </div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={e =>
                      handleFileUpload(e, `settings/appLogo.png`, 'appLogo')
                    }
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LogIn /> {t('login_background')}
                  </CardTitle>
                  <CardDescription>{t('login_background_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full h-24 mt-2 border rounded-md p-2 flex justify-center items-center bg-muted/30 overflow-hidden">
                    {draftSettings.loginBackground ? (
                      <Image
                        key={draftSettings.loginBackground}
                        src={draftSettings.loginBackground}
                        alt="Login BG Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Login BG Preview
                      </span>
                    )}
                  </div>
                  <Input
                    id="login-bg-upload"
                    type="file"
                    accept="image/*"
                    onChange={e =>
                      handleFileUpload(
                        e,
                        `settings/loginBackground.png`,
                        'loginBackground'
                      )
                    }
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard /> {t('main_dashboard_background')}
                  </CardTitle>
                  <CardDescription>{t('main_dashboard_background_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full h-24 mt-2 border rounded-md p-2 flex justify-center items-center bg-muted/30 overflow-hidden">
                    {draftSettings.mainBackground ? (
                      <Image
                        key={draftSettings.mainBackground}
                        src={draftSettings.mainBackground}
                        alt="Main BG Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Main BG Preview
                      </span>
                    )}
                  </div>
                  <Input
                    id="main-bg-upload"
                    type="file"
                    accept="image/*"
                    onChange={e =>
                      handleFileUpload(
                        e,
                        `settings/mainBackground.png`,
                        'mainBackground'
                      )
                    }
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon /> {t('dashboard_banner')}
                  </CardTitle>
                  <CardDescription>{t('dashboard_banner_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative w-full h-24 mt-2 border rounded-md p-2 flex justify-center items-center bg-muted/30 overflow-hidden">
                    {draftSettings.dashboardBanner ? (
                      <Image
                        key={draftSettings.dashboardBanner}
                        src={draftSettings.dashboardBanner}
                        alt="Banner Preview"
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Banner Preview
                      </span>
                    )}
                  </div>
                  <Input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={e =>
                      handleFileUpload(
                        e,
                        `settings/dashboardBanner.png`,
                        'dashboardBanner'
                      )
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="language" className="pt-6 space-y-6">
            <LoginTextEditor />
            <TranslationEditor onSave={handleSave} />
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
                    <Tabs
                      value={activePdfTab}
                      onValueChange={v =>
                        setActivePdfTab(v as 'report' | 'invoice' | 'card')
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="report">
                          <FileText className="mr-2" />
                          {t('report')}
                        </TabsTrigger>
                        <TabsTrigger value="invoice">
                          <Receipt className="mr-2" />
                          {t('invoice')}
                        </TabsTrigger>
                        <TabsTrigger value="card">
                          <CreditCard className="mr-2" />
                          {t('id_card')}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText /> {t('content')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="logo-upload-pdf">{t('company_logo')}</Label>
                      <Input
                        id="logo-upload-pdf"
                        type="file"
                        accept="image/*"
                        onChange={e =>
                          handleFileUpload(
                            e,
                            `settings/pdf/${activePdfTab}_logo.png`,
                            `pdfSettings.${activePdfTab}.logo`
                          )
                        }
                      />
                    </div>
                     {activePdfTab === 'invoice' && (
                        <div className="space-y-2">
                            <Label htmlFor="title-template">Title Template</Label>
                            <Input
                                id="title-template"
                                value={draftSettings.pdfSettings.invoice.titleTemplate || ''}
                                onChange={(e) => handlePdfSettingChange('titleTemplate', e.target.value)}
                                placeholder="e.g. Transmit to {city}"
                            />
                            <p className="text-xs text-muted-foreground">Use {'{city}'} as a placeholder for the destination.</p>
                        </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="header-text">
                        {t('header_text_optional')}
                      </Label>
                      <Input
                        id="header-text"
                        value={currentPdfSettings.headerText}
                        onChange={e =>
                          handlePdfSettingChange('headerText', e.target.value)
                        }
                        placeholder="e.g. Confidential Document"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-text">
                        {t('footer_text_optional')}
                      </Label>
                      <Input
                        id="footer-text"
                        value={currentPdfSettings.footerText}
                        onChange={e =>
                          handlePdfSettingChange('footerText', e.target.value)
                        }
                        placeholder="e.g. Generated by Ashley DRP"
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette /> {t('styling')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="pdf-scale">PDF Content Scale: {currentPdfSettings.scale ?? 2}</Label>
                        <Slider
                            id="pdf-scale"
                            min={1}
                            max={4}
                            step={0.1}
                            value={[currentPdfSettings.scale ?? 2]}
                            onValueChange={(value) => handlePdfSettingChange('scale', value[0])}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pdf-width">PDF Content Width: {currentPdfSettings.width ?? 800}px</Label>
                        <Slider
                            id="pdf-width"
                            min={500}
                            max={1200}
                            step={10}
                            value={[currentPdfSettings.width ?? 800]}
                            onValueChange={(value) => handlePdfSettingChange('width', value[0])}
                        />
                    </div>
                    {activePdfTab === 'report' ? (
                      <div className="space-y-4">
                        <CardDescription>
                          {t('report_color_desc')}
                        </CardDescription>
                        <div className="space-y-2">
                          <Label htmlFor="report-type-select">
                            {t('report_section')}
                          </Label>
                          <Select
                            value={selectedReportType}
                            onValueChange={(
                              v: keyof NonNullable<
                                AllPdfSettings['report']['reportColors']
                              >
                            ) => setSelectedReportType(v)}
                          >
                            <SelectTrigger id="report-type-select">
                              <SelectValue placeholder="Select a report type" />
                            </SelectTrigger>
                            <SelectContent>
                              {reportTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="theme-color">{t('theme_color')}</Label>
                          <Input
                            id="theme-color"
                            type="color"
                            value={
                              draftSettings.pdfSettings.report.reportColors?.[
                                selectedReportType
                              ] ?? '#000000'
                            }
                            onChange={e =>
                              handleReportColorChange(
                                selectedReportType,
                                e.target.value
                              )
                            }
                            className="w-10 h-10 p-1"
                          />
                        </div>
                      </div>
                    ) : activePdfTab === 'invoice' ? (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                                <Label htmlFor="secondary-color">{t('header_table_color')}</Label>
                                <Input
                                id="secondary-color"
                                type="color"
                                value={currentPdfSettings.secondaryColor ?? '#0F172A'}
                                onChange={e => handlePdfSettingChange('secondaryColor', e.target.value)}
                                className="w-10 h-10 p-1"
                                />
                            </div>
                        </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="theme-color">{t('theme_color')}</Label>
                        <Input
                          id="theme-color"
                          type="color"
                          value={currentPdfSettings.themeColor}
                          onChange={e =>
                            handlePdfSettingChange('themeColor', e.target.value)
                          }
                          className="w-10 h-10 p-1"
                        />
                      </div>
                    )}
                    {(activePdfTab === 'report' || activePdfTab === 'invoice') && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="table-theme-select">
                          {t('table_theme')}
                        </Label>
                        <Select
                          value={currentPdfSettings.tableTheme}
                          onValueChange={(v: 'striped' | 'grid') =>
                            handlePdfSettingChange('tableTheme', v)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="striped">{t('striped')}</SelectItem>
                            <SelectItem value="grid">{t('grid')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {activePdfTab === 'invoice' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Branch Colors</CardTitle>
                      <CardDescription>Set a unique color for each destination branch report.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {destinations.map(dest => (
                        <div key={dest} className="flex items-center justify-between">
                          <Label>{dest}</Label>
                          <Input
                            type="color"
                            value={(draftSettings.pdfSettings.invoice.branchColors as any)?.[dest] ?? '#000000'}
                            onChange={e => handleBranchColorChange(dest as any, e.target.value)}
                            className="w-10 h-10 p-1"
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('live_preview')}</CardTitle>
                    <CardDescription>
                      {t('live_preview_desc', { type: activePdfTab })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-muted/50 p-6 rounded-b-lg flex justify-center items-start overflow-auto">
                    <div
                      className="w-full max-w-3xl bg-white shadow-lg transform origin-top overflow-hidden flex flex-col"
                    >
                      {activePdfTab === 'report' && (
                        <ReportWrapper
                            title="Example Report Title"
                            date="This is an example subtitle"
                            logoSrc={currentPdfSettings.logo ?? draftSettings.appLogo}
                            themeColor={draftSettings.pdfSettings.report.reportColors?.[selectedReportType] || '#22c55e'}
                        >
                            <div className="p-6 flex-grow" style={{fontFamily: 'CustomPdfFont'}}>
                                <h3 className="font-bold text-gray-800 mb-2">{t('sample_section')}</h3>
                                <p className="text-sm text-gray-600 mb-4">{t('sample_body_text')}</p>
                                <Table className={cn(currentPdfSettings.tableTheme === 'grid' && 'border')}>
                                    <TableHeader>
                                        <TableRow style={{backgroundColor: draftSettings.pdfSettings.report.reportColors?.[selectedReportType], color: 'white'}} className="hover:bg-primary/90">
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
                        </ReportWrapper>
                      )}
                      {activePdfTab === 'invoice' && (
                        <TransmitReportPdf 
                           transfer={{...mockTransfer, destinationCity: 'Erbil'}}
                           items={mockTransferItems}
                           settings={{...currentPdfSettings, logo: currentPdfSettings.logo ?? draftSettings.appLogo}}
                           invoiceNumber={124}
                           totalYearlyInvoices={123}
                        />
                      )}
                      {activePdfTab === 'card' && (
                        <div className="flex justify-center items-center h-full p-4">
                          <EmployeePdfCard
                            employee={mockEmployee}
                            settings={{...currentPdfSettings, logo: currentPdfSettings.logo ?? draftSettings.appLogo}}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck /> {t('data_management')}
                </CardTitle>
                <CardDescription>{t('data_management_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="">{t('export_data_desc')}</p>
                  <Button onClick={handleExport} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> {t('export_data')}
                  </Button>
                </div>
                <div className="p-4 border rounded-lg space-y-4">
                  <p className="">{t('import_data_title')}</p>
                  <p className="text-sm text-destructive">
                    {t('import_data_warning')}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Input
                      type="file"
                      ref={importInputRef}
                      className="max-w-xs"
                      accept=".json"
                      onChange={handleImportFileSelect}
                    />
                    <Button onClick={handleRunImport} disabled={!importFile}>
                      <Play className="mr-2 h-4 w-4" /> {t('run_import')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default withAuth(SettingsPage);
