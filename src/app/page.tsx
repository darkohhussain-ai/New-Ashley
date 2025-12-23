"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Lock, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Dashboard } from "@/components/dashboard/dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import placeHolderImages from '@/lib/placeholder-images.json'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const { toast } = useToast()
  
  const defaultLogo = placeHolderImages.placeholderImages.find(p => p.id === 'default-logo')?.imageUrl || "https://picsum.photos/seed/ashley-drp-logo/120/120";
  const [logoSrc, setLogoSrc] = useState(defaultLogo)

  useEffect(() => {
    const savedLogo = localStorage.getItem('app-logo')
    if (savedLogo) {
      setLogoSrc(savedLogo)
    }
    // Check if user is already "logged in" in this session
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        setIsLoggedIn(true);
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === "Darko" && password === "123456") {
      sessionStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true)
      toast({
        title: "Login Successful",
        description: "Welcome, Admin!",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid username or password.",
      })
    }
  }
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result
        if (typeof result === 'string') {
          setLogoSrc(result)
          localStorage.setItem('app-logo', result)
          toast({ title: 'Logo updated successfully!' })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  if (isLoggedIn) {
    return <Dashboard logoSrc={logoSrc} />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 bg-grid-slate-100 dark:bg-grid-slate-900">
        <style jsx global>{`
          .bg-grid-slate-100 {
            background-image: linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, hsl(var(--background)) 1px);
            background-size: 2rem 2rem;
          }
          .dark .bg-grid-slate-900 {
            background-image: linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary) / 0.2) 1px, hsl(var(--background)) 1px);
          }
        `}</style>
      <div className="flex flex-col items-center justify-center w-full max-w-sm">
        <Image src={logoSrc} alt="Ashley DRP Manager Logo" width={100} height={100} className="mb-6 rounded-full object-cover aspect-square shadow-2xl" data-ai-hint="abstract logo"/>
        
        <Card className="w-full shadow-2xl bg-card/80 backdrop-blur-lg border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Ashley DRP Manager</CardTitle>
            <CardDescription>Admin Access Required</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative flex items-center">
                   <User className="absolute left-3 h-5 w-5 text-muted-foreground" />
                   <Input 
                     id="username" 
                     placeholder="Enter username" 
                     required 
                     type="text" 
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="pl-10"
                   />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    placeholder="Enter password" 
                    required 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button className="w-full font-bold" type="submit">
                Login
              </Button>
            </form>
             <div className="mt-6 text-center">
              <Label htmlFor="logo-upload" className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                Change Logo
              </Label>
              <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
