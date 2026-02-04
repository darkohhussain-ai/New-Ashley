'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { StagedItemsSummary } from '@/components/dashboard/StagedItemsSummary';

function TransmitDashboardPage() {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const { transferItems, transfers } = useAppContext();
    const router = useRouter();

    const menuItems = [
      {
        title: t('request_an_order'),
        icon: ListPlus,
        href: "/transmit/request-order",
        color: "bg-fuchsia-500",
        permission: 'page:transmit:request',
      },
      {
        title: t('view_order_requests'),
        icon: History,
        href: "/transmit/view-requests",
        color: "bg-indigo-500",
        permission: 'page:transmit:view-requests',
      },
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

    const recentRequests = useMemo(() => {
        if (!transferItems) return [];
        return transferItems
            .filter(item => item.requestedBy && !item.transferId)
            .sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
            .slice(0, 5);
    }, [transferItems]);


  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="w-full mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_dashboard')}</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{t('transmit_cargo')}</h1>
        </div>
      </header>
      <main className='w-full mx-auto p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
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
            <StagedItemsSummary />
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History /> {t('recent_order_requests')}</CardTitle>
                    <CardDescription>{t('recent_order_requests_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentRequests.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('model')}</TableHead>
                                    <TableHead>{t('destination')}</TableHead>
                                    <TableHead className="text-right">{t('requested')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRequests.map(item => (
                                    <TableRow key={item.id} onClick={() => router.push(`/transmit/view-requests`)} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell>{item.model}</TableCell>
                                        <TableCell>{item.destination}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{item.requestDate ? format(parseISO(item.requestDate), 'PP') : t('na')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">{t('no_open_order_requests')}</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

export default withAuth(TransmitDashboardPage);
