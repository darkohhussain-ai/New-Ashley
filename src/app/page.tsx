
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, Box, Settings as SettingsIcon, CreditCard, Bell, ChevronDown, Calendar, Clock, PackagePlus, Star, CheckSquare, RefreshCcw, Newspaper } from "lucide-react"
import { DashboardCard } from "@/components/dashboard/dashboard-card"
import useLocalStorage from "@/hooks/use-local-storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from 'date-fns';
import { Button } from "@/components/ui/button"

export default function Home() {
  const [date, setDate] = useState<Date | null>(null);

  // Load settings from localStorage
  const [savedBannerHeight] = useLocalStorage('dashboard-banner-height', 150);
  const [savedDashboardBanner] = useLocalStorage('dashboard-banner', 'https://i.ibb.co/6Wp2t1Y/image.png');
  const [savedLogo] = useLocalStorage('app-logo', "https://picsum.photos/seed/ashley-logo/300/100");
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsMounted(true);
    
    // Set the initial date only on the client
    setDate(new Date());
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const menuItems = [
    { title: "Ashley employees mangment", icon: CreditCard, href: "/ashley-expenses", color: "bg-blue-500" },
    { title: "Transmit Cargo", icon: PackagePlus, href: "/transmit", color: "bg-yellow-500" },
    { title: "Placement & Storage", icon: Box, href: "/items", color: "bg-green-500" },
    { title: "Marketing Feedback", icon: Star, href: "/marketing-feedback", color: "bg-cyan-500" },
    { title: "Report Designer", icon: Newspaper, href: "/report-designer", color: "bg-indigo-500" },
    { title: "Settings", icon: SettingsIcon, href: "/settings", color: "bg-purple-500" },
    { title: "Employees", icon: Users, href: "/employees", color: "bg-pink-500" },
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
      <header className="bg-card border-b top-0 z-10">
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
            <div className="flex items-center justify-center w-1/3">
              {savedLogo && (
                <div className="relative w-full max-w-[240px] aspect-[3/1]">
                    <Image src={savedLogo} alt="App Logo" fill className="object-contain" data-ai-hint="logo" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-4 w-1/3">
              <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="Refresh page">
                <RefreshCcw className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </Button>
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
           {savedDashboardBanner && (
             <div className="relative w-full mx-auto my-4 max-w-6xl rounded-lg overflow-hidden" style={{height: `${savedBannerHeight}px`}}>
                <Image src={savedDashboardBanner} alt="Dashboard Banner" fill className="object-contain" data-ai-hint="banner abstract" />
             </div>
           )}
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
            />
          ))}
        </div>
      </main>
    </div>
  )
}
