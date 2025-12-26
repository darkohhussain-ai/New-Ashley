
"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, Upload, Save, Palette, Type, ShieldCheck, Image as ImageIcon, LayoutDashboard, RefreshCcw } from 'lucide-react'
import useLocalStorage from '@/hooks/use-local-storage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/components/shared/theme-provider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import placeHolderImages from '@/lib/placeholder-images.json'
import { Slider } from '@/components/ui/slider'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useFirestore } from '@/firebase'
import { getDocs, collection, writeBatch, doc } from 'firebase/firestore'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

const availableFonts = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
]

type ThemeColors = {
  background: string;
  foreground: string;
  primary: string;
  accent: string;
  card: string;
}

const defaultLightColors: ThemeColors = { background: '0 0% 100%', foreground: '224 71.4% 4.1%', primary: '220 82% 55%', accent: '220 13% 91%', card: '0 0% 100%' };
const defaultDarkColors: ThemeColors = { background: '222.2 84% 4.9%', foreground: '210 40% 98%', primary: '217.2 91.2% 59.8%', accent: '217.2 32.6% 17.5%', card: '222.2 84% 4.9%' };


function parseHsl(hsl: string): { h: string, s: string, l: string } {
    if (typeof hsl !== 'string' || hsl.split(' ').length !== 3) {
        // Fallback to a default color if format is invalid
        const [h, s, l] = '0 0% 0%'.replace(/%/g, '').split(' ').map(s => s.trim());
        return { h, s, l };
    }
    const [h, s, l] = hsl.replace(/%/g, '').split(' ').map(s => s.trim());
    return { h, s, l };
}

function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (value: string) => void }) {
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
      <Label className="capitalize text-sm">{label}</Label>
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


export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false)
  
  const [savedFont, setSavedFont] = useLocalStorage('app-font', 'Inter')
  const [savedCustomFont, setSavedCustomFont] = useLocalStorage<string | null>('custom-font', null)
  
  const [savedLightColors, setSavedLightColors] = useLocalStorage<ThemeColors>('light-theme-colors', defaultLightColors);
  const [savedDarkColors, setSavedDarkColors] = useLocalStorage<ThemeColors>('dark-theme-colors', defaultDarkColors);
  
  const defaultLogo = placeHolderImages.placeholderImages.find(p => p.id === 'default-logo')?.imageUrl || "https://picsum.photos/seed/ashley-drp-logo/120/120";
  const [savedLogo, setSavedLogo] = useLocalStorage('app-logo', defaultLogo);
  const [savedLogoSize, setSavedLogoSize] = useLocalStorage('app-logo-size', 80);
  
  const [savedCardSize, setSavedCardSize] = useLocalStorage('dashboard-card-size', 192);
  const [savedIconSize, setSavedIconSize] = useLocalStorage('dashboard-icon-size', 64);


  const [font, setFont] = useState(savedFont);
  const [customFont, setCustomFont] = useState(savedCustomFont);
  const [lightColors, setLightColors] = useState(savedLightColors);
  const [darkColors, setDarkColors] = useState(savedDarkColors);
  const [logoSrc, setLogoSrc] = useState(savedLogo);
  const [logoSize, setLogoSize] = useState(savedLogoSize);
  const [cardSize, setCardSize] = useState(savedCardSize);
  const [iconSize, setIconSize] = useState(savedIconSize);

  const importInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null);

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      if (e.deltaY === 0) return;
      e.preventDefault();
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + e.deltaY * 2,
        behavior: 'smooth'
      });
    }
  };

  const applyColors = (colors: ThemeColors) => {
    const root = document.documentElement;
    if (!colors) return;
    Object.entries(colors).forEach(([key, value]) => {
      if (key && value) {
        root.style.setProperty(`--${key}`, value);
      }
    });
  };
  
  const applyCustomFont = (fontDataUrl: string | null) => {
    const styleId = 'custom-font-style';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }
    if(fontDataUrl) {
      styleElement.innerHTML = `
        @font-face {
          font-family: 'CustomFont';
          src: url(${fontDataUrl});
        }
      `;
    } else {
      styleElement.innerHTML = '';
    }
  }

  const applyFont = (fontName: string, customFontData: string | null) => {
    if (fontName === 'CustomFont' && customFontData) {
      applyCustomFont(customFontData);
      document.body.style.fontFamily = "'CustomFont', sans-serif";
    } else {
      applyCustomFont(null); // Remove custom font if not selected
      const selectedFont = availableFonts.find(f => f.name === fontName)
      if(selectedFont) {
          document.body.style.fontFamily = selectedFont.family
      }
    }
  }

  // Apply saved settings on initial mount
  useEffect(() => {
    setMounted(true)
    
    setFont(savedFont);
    setCustomFont(savedCustomFont);
    setLightColors(savedLightColors);
    setDarkColors(savedDarkColors);
    setLogoSrc(savedLogo);
    setLogoSize(savedLogoSize);
    setCardSize(savedCardSize);
    setIconSize(savedIconSize);

    
    applyFont(savedFont, savedCustomFont);

    if (document.documentElement.classList.contains('dark')) {
      applyColors(savedDarkColors);
    } else {
      applyColors(savedLightColors);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Apply live preview changes
  useEffect(() => {
    if(!mounted) return;
    if (theme === 'dark') {
      applyColors(darkColors);
    } else {
      applyColors(lightColors);
    }
    applyFont(font, customFont);
  }, [font, customFont, lightColors, darkColors, theme, mounted])

  useEffect(() => {
    if(!mounted) return;
    setSavedCardSize(cardSize);
    setSavedIconSize(iconSize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardSize, iconSize]);
  
  const handleFontChange = (fontName: string) => {
    setFont(fontName)
  }
  
  const handleCustomFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a .ttf, .otf, .woff, or .woff2 file.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCustomFont(result);
        setFont('CustomFont');
        toast({ title: 'Custom font selected!', description: 'Click "Save Changes" to apply.' });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result
        if (typeof result === 'string') {
          setLogoSrc(result)
          toast({ title: 'Logo updated!', description: 'Click "Save Changes" to apply.' })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = () => {
    setSavedFont(font);
    setSavedCustomFont(customFont);
    setSavedLightColors(lightColors);
    setSavedDarkColors(darkColors);
    setSavedLogo(logoSrc);
    setSavedLogoSize(logoSize);
    setSavedCardSize(cardSize);
    setSavedIconSize(iconSize);
    toast({ title: 'Settings saved!', description: 'Your appearance settings have been updated.' });
  }

  const handleResetToDefault = () => {
    setFont('Inter');
    setCustomFont(null);
    setLightColors(defaultLightColors);
    setDarkColors(defaultDarkColors);
    setLogoSrc(defaultLogo);
    setLogoSize(80);
    setCardSize(192);
    setIconSize(64);
    
    // Save defaults immediately
    setSavedFont('Inter');
    setSavedCustomFont(null);
    setSavedLightColors(defaultLightColors);
    setSavedDarkColors(defaultDarkColors);
    setSavedLogo(defaultLogo);
    setSavedLogoSize(80);
    setSavedCardSize(192);
    setSavedIconSize(64);
    
    toast({ title: 'Settings Reset', description: 'All appearance settings have been reset to their default values.' });
  }
  
  const handleExport = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Export failed', description: 'Database connection not available.' });
        return;
    }
    
    try {
        const backupData: { [key: string]: any } = {
            localStorage: {},
            firestore: {}
        };
        
        // 1. Get localStorage data
        const keysToExport = ['app-logo', 'app-logo-size', 'app-font', 'custom-font', 'light-theme-colors', 'dark-theme-colors', 'ashley-drp-theme', 'dashboard-card-size', 'dashboard-icon-size'];
        keysToExport.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    backupData.localStorage[key] = JSON.parse(item);
                } catch {
                    backupData.localStorage[key] = item;
                }
            }
        });

        // 2. Get Firestore data
        const collectionsToExport = ['employees', 'expenses', 'excel_files', 'storage_locations'];
        for (const collectionName of collectionsToExport) {
            const querySnapshot = await getDocs(collection(firestore, collectionName));
            backupData.firestore[collectionName] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Handle subcollections for excel_files
            if (collectionName === 'excel_files') {
                backupData.firestore.items = [];
                for (const fileDoc of querySnapshot.docs) {
                    const itemsSnapshot = await getDocs(collection(firestore, `excel_files/${fileDoc.id}/items`));
                    const items = itemsSnapshot.docs.map(itemDoc => ({ id: itemDoc.id, ...itemDoc.data() }));
                    backupData.firestore.items.push(...items);
                }
            }
        }
        
        // 3. Create and download blob
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ashley-hr-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Data exported successfully!' });

    } catch (error) {
        console.error("Export failed:", error);
        toast({ variant: 'destructive', title: 'Export failed', description: 'Could not export all application data.' });
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && firestore) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target?.result as string);
          
          // 1. Restore localStorage
          for (const key in backupData.localStorage) {
            const value = typeof backupData.localStorage[key] === 'object' 
                ? JSON.stringify(backupData.localStorage[key]) 
                : backupData.localStorage[key];
            localStorage.setItem(key, value);
          }

          // 2. Restore Firestore
          const firestoreData = backupData.firestore;
          const batch = writeBatch(firestore);

          for (const collectionName in firestoreData) {
            if (collectionName === 'items') continue; // handle items separately
            const collectionData = firestoreData[collectionName];
            collectionData.forEach((docData: any) => {
              const { id, ...data } = docData;
              batch.set(doc(firestore, collectionName, id), data);
            });
          }
          
          if (firestoreData.items) {
             firestoreData.items.forEach((itemData: any) => {
                const { id, fileId, ...data } = itemData;
                if(fileId) {
                   batch.set(doc(firestore, `excel_files/${fileId}/items`, id), data);
                }
             });
          }

          await batch.commit();

          toast({ title: 'Data imported successfully!', description: 'The page will now reload to apply changes.' });
          setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
          console.error("Import failed:", error);
          toast({ variant: 'destructive', title: 'Import failed', description: 'Invalid or corrupted file.' });
        }
      };
      reader.readAsText(file);
    }
  };


  if (!mounted) {
    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            </header>
            <div className="flex items-center justify-center">Loading...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-4 p-4 md:p-6 border-b">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
        <div className="ml-auto">
          <Button onClick={handleSaveChanges}>
            <Save className="mr-2 h-4 w-4" /> Save All Changes
          </Button>
        </div>
      </header>
      <main className="p-4 md:p-6">
        <ScrollArea className="w-full whitespace-nowrap" onWheel={onWheel}>
          <div className="flex w-max space-x-8 pb-4" ref={scrollRef}>
              <Card className='w-[350px]'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Palette /> Appearance</CardTitle>
                    <CardDescription>Customize the look and feel.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <Switch
                      id="dark-mode"
                      checked={theme === 'dark'}
                      onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                   <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="outline" className="w-full">
                                <RefreshCcw className="mr-2 h-4 w-4" /> Reset to Default
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reset all settings?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will reset all appearance settings (colors, fonts, logo) to their original defaults. Your data will not be affected. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetToDefault}>Reset Settings</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
              </Card>
              <Card className='w-[350px]'>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><ImageIcon /> Branding</CardTitle>
                  <CardDescription>Manage your application's logo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className='flex flex-col items-center justify-center gap-4'>
                     <Image src={logoSrc} alt="Current App Logo" width={logoSize} height={logoSize} className="rounded-full object-cover aspect-square shadow-md" style={{width: `${logoSize}px`, height: `${logoSize}px`}} />
                     <div className="w-full space-y-2">
                        <Label htmlFor="logo-size">Logo Size: {logoSize}px</Label>
                        <Slider
                            id="logo-size"
                            min={40}
                            max={240}
                            step={1}
                            value={[logoSize]}
                            onValueChange={(value) => setLogoSize(value[0])}
                        />
                     </div>
                  </div>
                  <div>
                    <Label htmlFor="logo-upload">Upload New Logo</Label>
                    <Input id="logo-upload" type="file" accept="image/*" className="mt-2" onChange={handleLogoUpload} />
                  </div>
                </CardContent>
              </Card>
               <Card className='w-[350px]'>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><LayoutDashboard /> Dashboard</CardTitle>
                  <CardDescription>Customize dashboard card appearance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="card-size">Card Size: {cardSize}px</Label>
                    <Slider
                      id="card-size"
                      min={120}
                      max={280}
                      step={4}
                      value={[cardSize]}
                      onValueChange={(value) => setCardSize(value[0])}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="icon-size">Icon Size: {iconSize}px</Label>
                    <Slider
                      id="icon-size"
                      min={32}
                      max={96}
                      step={4}
                      value={[iconSize]}
                      onValueChange={(value) => setIconSize(value[0])}
                    />
                  </div>
                </CardContent>
              </Card>
               <Card className='w-[350px]'>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck /> Data Management</CardTitle>
                    <CardDescription>Backup or restore your settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-4">
                    <Button onClick={handleExport} variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button onClick={() => importInputRef.current?.click()} variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" /> Import
                    </Button>
                    <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
                  </CardContent>
                </Card>
             <Card className='w-[450px]'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette/> Color Palette</CardTitle>
                    <CardDescription>Adjust colors for light and dark themes. Changes are previewed live.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="light" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="light">Light Mode</TabsTrigger>
                            <TabsTrigger value="dark">Dark Mode</TabsTrigger>
                        </TabsList>
                        <TabsContent value="light" className="space-y-4 pt-4">
                            <ColorPicker label="Background" value={lightColors.background} onChange={(c) => setLightColors(p => ({...p, background: c}))} />
                            <ColorPicker label="Foreground" value={lightColors.foreground} onChange={(c) => setLightColors(p => ({...p, foreground: c}))} />
                            <ColorPicker label="Primary" value={lightColors.primary} onChange={(c) => setLightColors(p => ({...p, primary: c}))} />
                            <ColorPicker label="Accent" value={lightColors.accent} onChange={(c) => setLightColors(p => ({...p, accent: c}))} />
                             <ColorPicker label="Card" value={lightColors.card} onChange={(c) => setLightColors(p => ({...p, card: c}))} />
                        </TabsContent>
                         <TabsContent value="dark" className="space-y-4 pt-4">
                            <ColorPicker label="Background" value={darkColors.background} onChange={(c) => setDarkColors(p => ({...p, background: c}))} />
                            <ColorPicker label="Foreground" value={darkColors.foreground} onChange={(c) => setDarkColors(p => ({...p, foreground: c}))} />
                            <ColorPicker label="Primary" value={darkColors.primary} onChange={(c) => setDarkColors(p => ({...p, primary: c}))} />
                            <ColorPicker label="Accent" value={darkColors.accent} onChange={(c) => setDarkColors(p => ({...p, accent: c}))} />
                            <ColorPicker label="Card" value={darkColors.card} onChange={(c) => setDarkColors(p => ({...p, card: c}))} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
             </Card>
             <Card className='w-[350px]'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Type /> Typography</CardTitle>
                    <CardDescription>Manage the font used in the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="font-select">Font Family</Label>
                        <Select value={font} onValueChange={handleFontChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableFonts.map(f => (
                                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                                ))}
                                {customFont && <SelectItem value="CustomFont">Custom Font</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                      <Label htmlFor="font-upload" className="text-sm font-medium">Upload Custom Font</Label>
                       <Input id="font-upload" type="file" accept=".ttf,.otf,.woff,.woff2" className="mt-2" onChange={handleCustomFontUpload} />
                       <p className="text-xs text-muted-foreground mt-2">Upload a .ttf, .otf, .woff, or .woff2 file.</p>
                    </div>
                </CardContent>
            </Card>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </main>
    </div>
  )
}
