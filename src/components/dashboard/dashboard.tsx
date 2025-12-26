
"use client"
import Image from "next/image"
import { Users, Box, ArrowRightLeft, Settings as SettingsIcon, CreditCard, Bell, ChevronDown } from "lucide-react"
import { DashboardCard } from "./dashboard-card"
import useLocalStorage from "@/hooks/use-local-storage"
import { useUser } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Dashboard() {
  const { user } = useUser();

  const menuItems = [
    { title: "Employees", icon: Users, href: "/employees", color: "border-pink-500 bg-pink-500" },
    { title: "Ashley Expenses", icon: CreditCard, href: "/expenses", color: "border-blue-500 bg-blue-500" },
    { title: "Placement & Storage", icon: Box, href: "/items", color: "border-green-500 bg-green-500" },
    { title: "Transmit", icon: ArrowRightLeft, href: "/transmit", color: "border-yellow-500 bg-yellow-500" },
    { title: "Settings", icon: SettingsIcon, href: "/settings", color: "border-purple-500 bg-purple-500" },
  ]
  
  const [logoSrc] = useLocalStorage('app-logo', "https://i.ibb.co/68RvM01/ashley-logo.png");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <Image src={logoSrc} alt="App Logo" width={32} height={32} className="object-contain" data-ai-hint="logo" />
              <h1 className="text-xl font-bold text-gray-800">Ashley HR</h1>
            </div>
            <div className="flex items-center gap-6">
              <Bell className="w-6 h-6 text-gray-500 hover:text-primary cursor-pointer" />
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback>{user?.email?.[0].toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">HR Dashboard</h2>
          <p className="text-gray-500">Select a service to continue.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {menuItems.map((item) => (
            <DashboardCard key={item.title} {...item} />
          ))}
        </div>
      </main>
    </div>
  )
}
