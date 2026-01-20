
'use client';

import Link from 'next/link';
import { CreditCard, Clock, Gift, Banknote, Settings, FileText, Calendar, Wallet } from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';

function AshleyExpensesDashboard() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  
  const menuItems = [
    {
      title: t('expenses'),
      icon: FileText,
      href: "/expenses",
      textColor: "text-blue-500",
      permission: 'page:ashley-expenses:expenses'
    },
    {
      title: t('overtime'),
      icon: Clock,
      href: "/overtime",
      textColor: "text-orange-500",
      permission: 'page:ashley-expenses:overtime'
    },
    {
      title: t('bonuses'),
      icon: Gift,
      href: "/bonuses",
      textColor: "text-yellow-500",
      permission: 'page:ashley-expenses:bonuses'
    },
    {
      title: t('cash_withdrawals'),
      icon: Banknote,
      href: "/cash-withdrawal",
      textColor: "text-rose-500",
      permission: 'page:ashley-expenses:withdrawals'
    },
    {
        title: t('monthly_reports'),
        icon: Calendar,
        href: "/monthly-report",
        textColor: "text-teal-500",
        permission: 'page:ashley-expenses:reports'
    },
    {
      title: t('settings'),
      icon: Settings,
      href: "/ashley-expenses-settings",
      textColor: "text-gray-500",
      permission: 'page:ashley-expenses:settings'
    }
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto'>
         <div className="mb-8">
            <h1 className="text-xl">{t('ashley_employees_management')}</h1>
         </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.filter(item => hasPermission(item.permission)).map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
                <Card className="h-48 flex flex-col justify-between p-6 transition-all hover:shadow-lg hover:-translate-y-1 border-2 border-transparent hover:border-primary/50">
                    <div>
                        <item.icon className={cn("w-8 h-8 mb-4", item.textColor)} />
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(AshleyExpensesDashboard);
