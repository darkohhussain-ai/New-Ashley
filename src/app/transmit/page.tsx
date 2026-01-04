
"use client";

import Link from 'next/link';
import { ArrowLeft, PackagePlus, ListPlus, Eye, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';

export default function TransmitDashboardPage() {
    const { t } = useTranslation();

    const menuItems = [
      {
        title: t('add_manage_items'),
        icon: ListPlus,
        href: "/transmit/add",
        color: "bg-blue-500",
      },
      {
        title: t('view_staged_items'),
        icon: ClipboardList,
        href: "/transmit/staged",
        color: "bg-orange-500",
      },
      {
        title: t('create_transfer_slip'),
        icon: PackagePlus,
        href: "/transmit/create",
        color: "bg-green-500",
      },
      {
        title: t('view_transfers'),
        icon: Eye,
        href: "/transmit/archive",
        color: "bg-purple-500",
      }
    ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_dashboard')}</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{t('transmit_cargo')}</h1>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
