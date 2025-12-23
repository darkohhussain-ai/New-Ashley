
"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, Box, ArrowRightLeft, Settings as SettingsIcon } from "lucide-react"
import { DashboardCard } from "./dashboard-card"
import placeHolderImages from '@/lib/placeholder-images.json'
import useLocalStorage from "@/hooks/use-local-storage"

export function Dashboard() {
  const menuItems = [
    { title: "Employees", icon: Users, href: "/employees" },
    { title: "Item Placement", icon: Box, href: "/items" },
    { title: "Transmit", icon: ArrowRightLeft, href: "/transmit" },
    { title: "Settings", icon: SettingsIcon, href: "/settings" },
  ]
  
  const defaultLogo = placeHolderImages.placeholderImages.find(p => p.id === 'default-logo')?.imageUrl || "https://picsum.photos/seed/ashley-hr-logo/120/120";
  const [logoSrc, setLogoSrc] = useLocalStorage('app-logo', defaultLogo);
  const [logoSize, setLogoSize] = useLocalStorage('app-logo-size', 80);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 flex flex-col items-center justify-center gap-4 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10 text-center">
        <Image src={logoSrc} alt="App Logo" width={logoSize} height={logoSize} className="rounded-full object-cover" data-ai-hint="abstract logo" style={{width: `${logoSize}px`, height: `${logoSize}px`}}/>
        <h1 className="text-2xl font-bold">Ashley HR</h1>
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
