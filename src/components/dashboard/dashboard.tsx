
"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, Box, ArrowRightLeft, Settings as SettingsIcon, CreditCard, Bell, ChevronDown, Calendar, Clock } from "lucide-react"
import { DashboardCard } from "./dashboard-card"
import useLocalStorage from "@/hooks/use-local-storage"
import { useUser } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from 'date-fns';

export function Dashboard() {
  const { user } = useUser();
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { title: "Employees", icon: Users, href: "/employees", color: "bg-pink-500" },
    { title: "Ashley Expenses", icon: CreditCard, href: "/expenses", color: "bg-blue-500" },
    { title: "Placement & Storage", icon: Box, href: "/items", color: "bg-green-500" },
    { title: "Transmit", icon: ArrowRightLeft, href: "/transmit", color: "bg-yellow-500" },
    { title: "Settings", icon: SettingsIcon, href: "/settings", color: "bg-purple-500" },
  ]
  
  const [logoSrc] = useLocalStorage('app-logo', "https://i.ibb.co/68RvM01/ashley-logo.png");
  const [logoSize] = useLocalStorage('app-logo-size', 32);
  const [cardSize] = useLocalStorage('dashboard-card-size', 192);
  const [iconSize] = useLocalStorage('dashboard-icon-size', 64);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground w-1/3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4"/>
                    <span>{format(date, 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4"/>
                    <span>{format(date, 'h:mm:ss a')}</span>
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
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase() || 'A'}</AvatarFallback>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
