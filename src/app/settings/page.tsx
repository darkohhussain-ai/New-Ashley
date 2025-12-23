"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Moon, Sun, Download, Upload } from 'lucide-react'
import useLocalStorage from '@/hooks/use-local-storage'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/components/shared/theme-provider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const availableFonts = [
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const [font, setFont] = useLocalStorage('app-font', 'Inter')

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    handleFontChange(font, false) // Apply font on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font])
  
  const handleFontChange = (fontName: string, save: boolean = true) => {
    const selectedFont = availableFonts.find(f => f.name === fontName)
    if(selectedFont) {
        document.body.style.fontFamily = selectedFont.family
        if (save) {
            setFont(fontName)
        }
    }
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

        // We parse and re-stringify to get pretty JSON for items that are stringified JSON
        Object.keys(data).forEach(key => {
            try {
                data[key] = JSON.parse(data[key]);
            } catch (e) {
                // Not a JSON string, keep as is
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
            <CardDescription>Customize the look and feel of the app.</CardDescription>
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
            
            <div className="flex items-center justify-between rounded-lg border p-4">
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
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
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
