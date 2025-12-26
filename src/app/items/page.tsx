
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
    color: "bg-pink-500",
  },
  {
    title: "New Excel File",
    icon: FilePlus,
    href: "/new-file",
    color: "bg-blue-500",
  },
  {
    title: "Import Excel File",
    icon: Upload,
    href: "/import",
    color: "bg-teal-500",
  },
  {
    title: "Excel Archive",
    icon: Archive,
    href: "/archive",
    color: "bg-yellow-500",
  },
  {
    title: "PDF Archive",
    icon: FileText,
    href: "/pdf-archive",
    color: "bg-purple-500",
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
                <Card className={cn("h-48 flex flex-col items-center justify-center text-white transition-transform transform hover:-translate-y-1 hover:shadow-xl", item.color)}>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-4 bg-white/20 rounded-full mb-4">
                        <item.icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
