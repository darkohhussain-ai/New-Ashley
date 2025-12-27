
"use client";

import Link from 'next/link';
import { ArrowLeft, PackagePlus, ListPlus, Archive, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: "Add & Manage Items",
    icon: ListPlus,
    href: "/transmit/add",
    color: "bg-blue-500",
    description: "Add new items to the transfer list and manage them before shipping."
  },
  {
    title: "Create Transfer Slip",
    icon: PackagePlus,
    href: "/transmit/create",
    color: "bg-green-500",
    description: "Select staged items and generate a final cargo transfer slip."
  },
  {
    title: "View Transfers",
    icon: Eye,
    href: "/transmit/archive",
    color: "bg-purple-500",
    description: "View and retrieve previously created transfer slips."
  }
];

export default function TransmitDashboardPage() {
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
          <h1 className="text-xl font-bold">Transmit Cargo</h1>
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
