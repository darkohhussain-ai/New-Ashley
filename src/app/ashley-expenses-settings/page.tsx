
"use client"
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AshleyExpensesSettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ashley-expenses">
              <ArrowLeft />
              <span className="sr-only">Back to Ashley Expenses</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Ashley Expenses Settings</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
         <Card>
            <CardHeader>
                <CardTitle>Under Construction</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This section is not yet available.</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
