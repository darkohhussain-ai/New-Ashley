"use client"
import Image from "next/image"
import { Users, Box, ArrowRightLeft, Settings as SettingsIcon } from "lucide-react"
import { DashboardCard } from "./dashboard-card"

export function Dashboard({ logoSrc }: { logoSrc: string }) {
  const menuItems = [
    { title: "Volunteers HR", icon: Users, href: "/volunteers" },
    { title: "Item Placement", icon: Box, href: "/items" },
    { title: "Transmit", icon: ArrowRightLeft, href: "/transmit" },
    { title: "Settings", icon: SettingsIcon, href: "/settings" },
  ]

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
