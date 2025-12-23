
"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, Save, Palette, Type, ShieldCheck } from 'lucide-react'
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
  const [mounted, setMounted] = useState(false)
  
  const [savedFont, setSavedFont] = useLocalStorage('app-font', 'Inter')
  const [savedCustomFont, setSavedCustomFont] = useLocalStorage<string | null>('custom-font', null)
  
  const [savedLightColors, setSavedLightColors] = useLocalStorage<ThemeColors>('light-theme-colors', defaultLightColors);
  const [savedDarkColors, setSavedDarkColors] = useLocalStorage<ThemeColors>('dark-theme-colors', defaultDarkColors);

  const [font, setFont] = useState(savedFont);
  const [customFont, setCustomFont] = useState(savedCustomFont);
  const [lightColors, setLightColors] = useState(savedLightColors);
  const [darkColors, setDarkColors] = useState(savedDarkColors);

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
    
    // The useLocalStorage hook now correctly handles initial hydration
    // so we can directly use the state values it provides.
    setFont(savedFont);
    setCustomFont(savedCustomFont);
    setLightColors(savedLightColors);
    setDarkColors(savedDarkColors);
    
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
        // Only backup relevant keys
        const keysToExport = ['app-logo', 'app-font', 'custom-font', 'light-theme-colors', 'dark-theme-colors', 'ashley-drp-theme', 'volunteers'];
        
        keysToExport.forEach(key => {
             const item = localStorage.getItem(key);
             if(item) {
                // custom-font is a large base64 string, don't parse it.
                if (key === 'custom-font' || key === 'app-logo') {
                    data[key] = item;
                } else {
                    try {
                        data[key] = JSON.parse(item);
                    } catch {
                        data[key] = item;
                    }
                }
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
        console.error("Export failed:", error);
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
            if (Object.prototype.hasOwnProperty.call(importedData, key)) {
                const value = typeof importedData[key] === 'object' 
                    ? JSON.stringify(importedData[key]) 
                    : importedData[key];
                localStorage.setItem(key, value);
            }
          }
          toast({ title: 'Data imported successfully!', description: 'The page will now reload to apply changes.' })
          setTimeout(() => window.location.reload(), 2000)
        } catch (error) {
          console.error("Import failed:", error);
          toast({ variant: 'destructive', title: 'Import failed', description: 'Invalid or corrupted file.' })
        }
      }
      reader.readAsText(file)
    }
  }

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
      </header>
      <main className="p-4 md:p-6 space-y-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-8">
              <Card>
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
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSaveChanges} className="w-full">
                      <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </CardFooter>
              </Card>
               <Card>
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
          </div>
          <div className="md:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette/> Color Palette</CardTitle>
                    <CardDescription>Adjust the colors for light and dark themes.</CardDescription>
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
             <Card>
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
        </div>
      </main>
    </div>
  )
}

    