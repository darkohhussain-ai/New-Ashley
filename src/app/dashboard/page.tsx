
"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, Box, Settings as SettingsIcon, CreditCard, Bell, ChevronDown, Calendar, Clock, PackagePlus, Star, CheckSquare } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import useLocalStorage from "@/hooks/use-local-storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from 'date-fns';

export default function Dashboard() {
  const [date, setDate] = useState<Date | null>(null);

  // Load settings from localStorage
  const [savedLogoSrc] = useLocalStorage('app-logo', "https://i.ibb.co/wJm3Sg7/ashley-logo-new.png");
  const [savedLogoSize] = useLocalStorage('app-logo-size', 80);
  const [savedCardSize] = useLocalStorage('dashboard-card-size', 192);
  const [savedIconSize] = useLocalStorage('dashboard-icon-size', 64);

  // State for rendering, initialized to defaults to match server render
  const [logoSrc, setLogoSrc] = useState("https://i.ibb.co/wJm3Sg7/ashley-logo-new.png");
  const [logoSize, setLogoSize] = useState(80);
  const [cardSize, setCardSize] = useState(192);
  const [iconSize, setIconSize] = useState(64);
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsMounted(true);
    
    setLogoSrc(savedLogoSrc);
    setLogoSize(savedLogoSize);
    setCardSize(savedCardSize);
    setIconSize(savedIconSize);

    // Set the initial date only on the client
    setDate(new Date());
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, [savedLogoSrc, savedLogoSize, savedCardSize, savedIconSize]);

  const menuItems = [
    { title: "Employees", icon: Users, href: "/employees", color: "bg-pink-500" },
    { title: "Marketing Evaluation", icon: Star, href: "/marketing-evaluation", color: "bg-cyan-500" },
    { title: "Ashley Expenses", icon: CreditCard, href: "/ashley-expenses", color: "bg-blue-500" },
    { title: "Placement & Storage", icon: Box, href: "/items", color: "bg-green-500" },
    { title: "Transmit Cargo", icon: PackagePlus, href: "/transmit", color: "bg-yellow-500" },
    { title: "Reality Check", icon: CheckSquare, href: "/reality-check", color: "bg-indigo-500" },
    { title: "Settings", icon: SettingsIcon, href: "/settings", color: "bg-purple-500" },
  ]

  // We can return a loading state or the default view until the client has mounted
  // to prevent hydration mismatch. Here, we render the default view on the server
  // and then update it on the client once localStorage is available.
  if (!isMounted) {
      // Render a placeholder or the default server-rendered version.
      // Returning the default version is okay since it will match the server.
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground w-1/3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4"/>
                    <span>{date ? format(date, 'MMMM d, yyyy') : '...'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4"/>
                    <span>{date ? format(date, 'h:mm:ss a') : '...'}</span>
                </div>
            </div>
            <div className="flex items-center justify-center gap-4 w-1/3">
              <Image src={logoSrc} alt="App Logo" width={logoSize} height={logoSize} className="object-contain" data-ai-hint="logo" />
              <h1 className="text-xl font-bold">Ashley HR</h1>
            </div>
            <div className="flex items-center justify-end gap-6 w-1/3">
              <Bell className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer" />
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={undefined} />
                  <AvatarFallback>{'A'}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">Select a service to continue.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <DashboardCard 
                key={item.title} 
                {...item} 
                cardSize={cardSize}
                iconSize={iconSize}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
