
'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';


function OvertimeDashboardPage() {
  const { t } = useTranslation();
  
  const menuItems = [
    {
      title: t('add_daily_overtime'),
      icon: Clock,
      href: "/overtime/add",
      color: "bg-blue-500",
    },
    {
      title: t('monthly_overtime_report'),
      icon: Calendar,
      href: "/overtime/monthly-report",
      color: "bg-orange-500",
    },
    {
      title: t('overtime_archive'),
      icon: Archive,
      href: "/overtime/archive",
      color: "bg-teal-500",
    },
  ];

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ashley-expenses">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_ashley_management')}</span>
            </Link>
          </Button>
          <h1 className="text-xl">{t('employee_overtime')}</h1>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
                <Card className={cn("h-48 flex flex-col items-center justify-center text-white transition-transform transform hover:-translate-y-1 hover:shadow-xl", item.color)}>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-4 bg-white/20 rounded-full mb-4">
                        <item.icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(OvertimeDashboardPage);
