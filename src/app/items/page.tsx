"use client"
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ItemsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Item Placement</h1>
      </header>
      <main>
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
