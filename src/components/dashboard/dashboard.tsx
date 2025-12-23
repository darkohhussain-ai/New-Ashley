
"use client"
import Image from "next/image"
import { Users, Box, ArrowRightLeft, Settings as SettingsIcon, CreditCard } from "lucide-react"
import { DashboardCard } from "./dashboard-card"
import placeHolderImages from '@/lib/placeholder-images.json'
import useLocalStorage from "@/hooks/use-local-storage"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export function Dashboard() {
  const menuItems = [
    { title: "Employees", icon: Users, href: "/employees" },
    { title: "Ashley Expenses", icon: CreditCard, href: "/expenses" },
    { title: "Item Placement", icon: Box, href: "/items" },
    { title: "Transmit", icon: ArrowRightLeft, href: "/transmit" },
    { title: "Settings", icon: SettingsIcon, href: "/settings" },
  ]
  
  const defaultLogo = placeHolderImages.placeholderImages.find(p => p.id === 'default-logo')?.imageUrl || "https://picsum.photos/seed/ashley-hr-logo/120/120";
  const [logoSrc, setLogoSrc] = useLocalStorage('app-logo', defaultLogo);
  const [logoSize, setLogoSize] = useLocalStorage('app-logo-size', 80);

  const [cardSize, setCardSize] = useLocalStorage('dashboard-card-size', 192);
  const [iconSize, setIconSize] = useLocalStorage('dashboard-icon-size', 64);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 flex flex-col items-center justify-center gap-2 border-b sticky top-0 bg-background/80 backdrop-blur-lg z-10 text-center">
        <Image src={logoSrc} alt="App Logo" width={logoSize} height={logoSize} className="rounded-full object-cover" data-ai-hint="abstract logo" style={{width: `${logoSize * 0.5}px`, height: `${logoSize * 0.5}px`}}/>
        <h1 className="text-lg font-bold">Ashley HR</h1>
      </header>
      <main className="p-8 md:p-12">
         <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-8 pb-4">
              {menuItems.map((item) => (
                <div key={item.title} style={{ width: `${cardSize}px` }}>
                   <DashboardCard {...item} cardSize={cardSize} iconSize={iconSize} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
         </ScrollArea>
      </main>
    </div>
  )
}
