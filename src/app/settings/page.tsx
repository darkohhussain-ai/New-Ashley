"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, Save } from 'lucide-react'
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

const availableFonts = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
]

type ThemeColors = {
  background: string;
  primary: string;
  accent: string;
}

const defaultLightColors: ThemeColors = { background: '208 100% 97%', primary: '197 71% 73%', accent: '285 16% 64%' };
const defaultDarkColors: ThemeColors = { background: '222.2 84% 4.9%', primary: '217.2 91.2% 59.8%', accent: '217.2 32.6% 17.5%' };

function parseHsl(hsl: string): { h: string, s: string, l: string } {
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
    <div className="flex items-center justify-between rounded-lg border p-4">
      <Label className="capitalize">{label}</Label>
      <div className='flex items-center gap-2'>
        <Input 
          type="color" 
          value={hslToHex(Number(h), Number(s), Number(l))}
          onChange={(e) => handleHexChange(e.target.value)}
          className="w-10 h-10 p-1"
        />
        <div className="flex flex-col gap-1 text-xs">
           <div className="flex items-center gap-1">H<Input className="h-6 text-xs" value={h} onChange={e => handleHslChange('h', e.target.value)} /></div>
           <div className="flex items-center gap-1">S<Input className="h-6 text-xs" value={s} onChange={e => handleHslChange('s', e.target.value)} /></div>
           <div className="flex items-center gap-1">L<Input className="h-6 text-xs" value={l} onChange={e => handleHslChange('l', e.target.value)} /></div>
        </div>
      </div>
    </div>
  );
}


export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const [savedFont, setSavedFont] = useLocalStorage('app-font', 'Inter')
  const [savedCustomFont, setSavedCustomFont] = useLocalStorage<string | null>('custom-font', null)
  
  const [savedLightColors, setSavedLightColors] = useLocalStorage<ThemeColors>('light-theme-colors', defaultLightColors);
  const [savedDarkColors, setSavedDarkColors] = useLocalStorage<ThemeColors>('dark-theme-colors', defaultDarkColors);

  const [font, setFont] = useState(savedFont);
  const [customFont, setCustomFont] = useState(savedCustomFont);
  const [lightColors, setLightColors] = useState(savedLightColors);
  const [darkColors, setDarkColors] = useState(savedDarkColors);

  const applyColors = (colors: ThemeColors, prefix = '') => {
    const root = document.documentElement;
    if(prefix){
        root.style.setProperty(`--${prefix}background`, colors.background);
        root.style.setProperty(`--${prefix}primary`, colors.primary);
        root.style.setProperty(`--${prefix}accent`, colors.accent);
    } else {
        root.style.setProperty(`--background`, colors.background);
        root.style.setProperty(`--primary`, colors.primary);
        root.style.setProperty(`--accent`, colors.accent);
    }
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
      const selectedFont = availableFonts.find(f => f.name === fontName)
      if(selectedFont) {
          document.body.style.fontFamily = selectedFont.family
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    applyFont(savedFont, savedCustomFont)
    
    if (document.documentElement.classList.contains('dark')) {
      applyColors(savedDarkColors, 'dark-');
    } else {
      applyColors(savedLightColors);
    }
  }, [])
  
  useEffect(() => {
    if(!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add("dark");
      applyColors(darkColors, 'dark-');
    } else {
      document.documentElement.classList.remove("dark");
      applyColors(lightColors);
    }
    applyFont(font, customFont);
  }, [font, customFont, lightColors, darkColors, theme, mounted])
  
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

  const handleSaveChanges = () => {
    setSavedFont(font);
    setSavedCustomFont(customFont);
    setSavedLightColors(lightColors);
    setSavedDarkColors(darkColors);
    toast({ title: 'Settings saved!', description: 'Your appearance settings have been updated.' });
  }

  const handleExport = () => {
    try {
        const data: { [key: string]: any } = {}
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if(key) {
                data[key] = localStorage.getItem(key)
            }
        }

        Object.keys(data).forEach(key => {
            try {
                data[key] = JSON.parse(data[key]);
            } catch (e) {
            }
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ashley-drp-backup-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast({ title: 'Data exported successfully!' })
    } catch (error) {
        toast({ variant: 'destructive', title: 'Export failed', description: 'Could not export data.' })
    }
  }

  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string)
          for (const key in importedData) {
            const value = typeof importedData[key] === 'object' ? JSON.stringify(importedData[key]) : importedData[key];
            localStorage.setItem(key, value)
          }
          toast({ title: 'Data imported successfully!', description: 'The page will now reload to apply changes.' })
          setTimeout(() => window.location.reload(), 2000)
        } catch (error) {
          toast({ variant: 'destructive', title: 'Import failed', description: 'Invalid or corrupted file.' })
        }
      }
      reader.readAsText(file)
    }
  }

  if (!mounted) {
    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Settings</h1>
            </header>
        </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>
      <main className="space-y-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the app. Click "Save Changes" to apply.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span className="font-semibold">Dark Mode</span>
                <span className="text-sm text-muted-foreground">
                    Toggle between light and dark themes.
                </span>
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
            </div>
            
            <div className="space-y-4 rounded-lg border p-4">
               <Label className="font-semibold">Colors</Label>
                 <Tabs defaultValue="light">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="light">Light Mode</TabsTrigger>
                        <TabsTrigger value="dark">Dark Mode</TabsTrigger>
                    </TabsList>
                    <TabsContent value="light" className="space-y-4 pt-4">
                        <ColorPicker label="Background" value={lightColors.background} onChange={(c) => setLightColors(p => ({...p, background: c}))} />
                        <ColorPicker label="Primary" value={lightColors.primary} onChange={(c) => setLightColors(p => ({...p, primary: c}))} />
                        <ColorPicker label="Accent" value={lightColors.accent} onChange={(c) => setLightColors(p => ({...p, accent: c}))} />
                    </TabsContent>
                     <TabsContent value="dark" className="space-y-4 pt-4">
                        <ColorPicker label="Background" value={darkColors.background} onChange={(c) => setDarkColors(p => ({...p, background: c}))} />
                        <ColorPicker label="Primary" value={darkColors.primary} onChange={(c) => setDarkColors(p => ({...p, primary: c}))} />
                        <ColorPicker label="Accent" value={darkColors.accent} onChange={(c) => setDarkColors(p => ({...p, accent: c}))} />
                    </TabsContent>
                </Tabs>
            </div>
            
            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="font-select" className="flex flex-col gap-1">
                        <span className="font-semibold">Font Family</span>
                         <span className="text-sm text-muted-foreground">
                            Change the application's font.
                        </span>
                    </Label>
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
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges} className="w-full">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Backup your application data to a file, or import from one.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Button onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
            <Button onClick={() => importInputRef.current?.click()} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" /> Import Data
            </Button>
            <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
