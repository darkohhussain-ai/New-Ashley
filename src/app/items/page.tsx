
"use client";

import Link from 'next/link';
import { ArrowLeft, MapPin, FilePlus, Upload, Archive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const menuItems = [
  {
    title: "Manage Locations",
    icon: MapPin,
    href: "/locations",
    description: "Add, edit, or remove warehouse and storage locations.",
  },
  {
    title: "New Excel File",
    icon: FilePlus,
    href: "/new-file",
    description: "Create a new inventory sheet from scratch.",
    disabled: false,
  },
  {
    title: "Import Excel File",
    icon: Upload,
    href: "/import",
    description: "Import an existing Excel file to track inventory.",
  },
  {
    title: "Excel Archive",
    icon: Archive,
    href: "/archive",
    description: "View and edit all previously created or imported Excel files.",
  },
  {
    title: "PDF Archive",
    icon: FileText,
    href: "/pdf-archive",
    description: "View and download read-only PDF reports of your files.",
  }
];

export default function ItemsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft />
            <span className="sr-only">Back to Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Placement & Storage</h1>
      </header>
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.title} href={item.disabled ? "#" : item.href} className={`group ${item.disabled ? 'pointer-events-none' : ''}`} passHref>
              <Card className={`flex flex-col h-full transition-all duration-200 ${item.disabled ? 'bg-muted/50' : 'hover:border-primary hover:shadow-lg'}`}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <item.icon className={`w-8 h-8 mt-1 ${item.disabled ? 'text-muted-foreground' : 'text-primary'}`} />
                    <div>
                      <CardTitle className={item.disabled ? 'text-muted-foreground' : ''}>{item.title}</CardTitle>
                      <CardDescription className="mt-2">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {item.disabled && (
                  <CardContent>
                    <p className="text-xs text-center text-muted-foreground font-semibold">Coming Soon</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
