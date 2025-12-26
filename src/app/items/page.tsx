
"use client";

import Link from 'next/link';
import { ArrowLeft, MapPin, FilePlus, Upload, Archive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: "Manage Locations",
    icon: MapPin,
    href: "/locations",
    description: "Add, edit, or remove warehouse and storage locations.",
    color: "text-blue-500",
  },
  {
    title: "New Excel File",
    icon: FilePlus,
    href: "/new-file",
    description: "Create a new inventory sheet from scratch.",
    color: "text-green-500",
  },
  {
    title: "Import Excel File",
    icon: Upload,
    href: "/import",
    description: "Import an existing Excel file to track inventory.",
    color: "text-purple-500",
  },
  {
    title: "Excel Archive",
    icon: Archive,
    href: "/archive",
    description: "View and edit all previously created or imported Excel files.",
    color: "text-orange-500",
  },
  {
    title: "PDF Archive",
    icon: FileText,
    href: "/pdf-archive",
    description: "View and download read-only PDF reports of your files.",
    color: "text-pink-500",
  }
];

export default function ItemsPage() {
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
          <h1 className="text-xl font-bold">Placement & Storage</h1>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
              <Card className="flex flex-col h-full transition-all duration-200 hover:border-primary hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2 bg-primary/10 rounded-lg", item.color)}>
                        <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription className="mt-2">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
