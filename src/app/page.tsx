
"use client"

import { useEffect } from "react"
import { useAuth, useUser, initiateAnonymousSignIn } from "@/firebase"
import { Dashboard } from "@/components/dashboard/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Home() {
  const auth = useAuth()
  const { user, isUserLoading } = useUser()

  useEffect(() => {
    // Automatically sign in the user anonymously if they are not already signed in.
    // This is for demonstration purposes. In a real app, you'd have a proper login flow.
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth)
    }
  }, [auth, user, isUserLoading])

  if (isUserLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </main>
    )
  }

  if (user) {
    return <Dashboard />
  }

  // Fallback for when sign-in is initiated but not yet complete,
  // or if there was an issue. A real app would have a more robust UI.
  return (
     <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 bg-grid-slate-100 dark:bg-grid-slate-900">
        <style jsx global>{`
          .bg-grid-slate-100 {
            background-image: linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, hsl(var(--background)) 1px);
            background-size: 2rem 2rem;
          }
          .dark .bg-grid-slate-900 {
            background-image: linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent-1px), linear-gradient(to right, hsl(var(--primary) / 0.2) 1px, hsl(var(--background)) 1px);
          }
        `}</style>
      <div className="flex flex-col items-center justify-center w-full max-w-sm">
        <Card className="w-full shadow-2xl bg-card/80 backdrop-blur-lg border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Ashley HR</CardTitle>
            <CardDescription>Please wait while we sign you in.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
             </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
