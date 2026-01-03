
'use client';

import Link from 'next/link';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">My Account</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-6 h-6" />
              Account Details
            </CardTitle>
            <CardDescription>
              This section is under construction. User authentication and roles will be available soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for your patience as we build out this feature.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
