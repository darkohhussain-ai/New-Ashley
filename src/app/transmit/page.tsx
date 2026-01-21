
"use client";

import Link from 'next/link';
import { ArrowLeft, PackagePlus, ListPlus, Eye, ClipboardList, Truck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import { useAppContext } from '@/context/app-provider';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function TransmitDashboardPage() {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const { transferItems, transfers } = useAppContext();

    const menuItems = [
      {
        title: t('add_manage_items'),
        icon: ListPlus,
        href: "/transmit/add",
        color: "bg-blue-500",
        permission: 'page:transmit:add',
      },
      {
        title: t('view_staged_items'),
        icon: ClipboardList,
        href: "/transmit/staged",
        color: "bg-orange-500",
        permission: 'page:transmit:staged',
      },
      {
        title: t('create_transfer_slip'),
        icon: PackagePlus,
        href: "/transmit/create",
        color: "bg-green-500",
        permission: 'page:transmit:create',
      },
      {
        title: t('view_transfers'),
        icon: Eye,
        href: "/transmit/archive",
        color: "bg-purple-500",
        permission: 'page:transmit:archive',
      }
    ];

    const stagedItemsByDestination = useMemo(() => {
        const staged = transferItems.filter(item => !item.transferId);
        const grouped = staged.reduce((acc, item) => {
            if (!acc[item.destination]) {
                acc[item.destination] = { count: 0 };
            }
            acc[item.destination].count++;
            return acc;
        }, {} as Record<string, { count: number }>);
        return Object.entries(grouped).map(([destination, data]) => ({ destination, ...data }));
    }, [transferItems]);

    const recentTransfers = useMemo(() => {
        if (!transfers) return [];
        return transfers
            .filter(t => t.transferDate && !isNaN(parseISO(t.transferDate).getTime()))
            .sort((a,b) => parseISO(b.transferDate).getTime() - parseISO(a.transferDate).getTime())
            .slice(0, 5);
    }, [transfers]);


  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
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
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.filter(item => hasPermission(item.permission)).map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
                <Card className={cn("h-40 flex flex-col items-center justify-center text-white transition-transform transform hover:-translate-y-1 hover:shadow-xl", item.color)}>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-3 bg-white/20 rounded-full mb-3">
                        <item.icon className="w-7 h-7" />
                    </div>
                    <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList /> {t('staged_items_summary')}</CardTitle>
                    <CardDescription>{t('staged_items_summary_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {stagedItemsByDestination.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('destination')}</TableHead>
                                    <TableHead className="text-right">{t('items_staged')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stagedItemsByDestination.map(item => (
                                    <TableRow key={item.destination}>
                                        <TableCell className="font-medium">{item.destination}</TableCell>
                                        <TableCell className="text-right">{item.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('no_items_currently_staged')}</p>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History /> {t('recent_transfers')}</CardTitle>
                    <CardDescription>{t('recent_transfers_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     {recentTransfers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead>{t('destination')}</TableHead>
                                    <TableHead className="text-right">{t('items_count')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTransfers.map(transfer => (
                                    <TableRow key={transfer.id}>
                                        <TableCell>{format(parseISO(transfer.transferDate), 'PP')}</TableCell>
                                        <TableCell>{transfer.destinationCity}</TableCell>
                                        <TableCell className="text-right">{transfer.itemIds.length}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('no_recent_transfers')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

export default withAuth(TransmitDashboardPage);
