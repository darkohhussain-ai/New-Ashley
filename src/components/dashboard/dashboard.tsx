"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, Box, ArrowRightLeft, Settings as SettingsIcon } from "lucide-react"
import { DashboardCard } from "./dashboard-card"
import placeHolderImages from '@/lib/placeholder-images.json'

export function Dashboard() {
  const menuItems = [
    { title: "Volunteers HR", icon: Users, href: "/volunteers" },
    { title: "Item Placement", icon: Box, href: "/items" },
    { title: "Transmit", icon: ArrowRightLeft, href: "/transmit" },
    { title: "Settings", icon: SettingsIcon, href: "/settings" },
  ]
  
  const defaultLogo = placeHolderImages.placeholderImages.find(p => p.id === 'default-logo')?.imageUrl || "https://picsum.photos/seed/ashley-drp-logo/120/120";
  const [logoSrc, setLogoSrc] = useState(defaultLogo);

  useEffect(() => {
    const savedLogo = localStorage.getItem('app-logo');
    if (savedLogo) {
      // Check if it's a base64 string or a URL
      if (!savedLogo.startsWith('http') && !savedLogo.startsWith('data:')) {
         // It might be a quoted string from old localStorage, try parsing
         try {
            const parsed = JSON.parse(savedLogo);
            setLogoSrc(parsed);
         } catch {
            setLogoSrc(savedLogo); // Fallback to raw value
         }
      } else {
        setLogoSrc(savedLogo);
      }
    }
  }, []);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 flex items-center gap-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10">
        <Image src={logoSrc} alt="App Logo" width={40} height={40} className="rounded-full object-cover" data-ai-hint="abstract logo"/>
        <h1 className="text-2xl font-bold">Ashley DRP Manager</h1>
      </header>
      <main className="p-8 md:p-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {menuItems.map((item) => (
            <DashboardCard key={item.title} {...item} />
          ))}
        </div>
      </main>
    </div>
  )
}
