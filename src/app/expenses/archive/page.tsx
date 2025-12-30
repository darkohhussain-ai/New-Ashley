
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Calendar as CalendarIcon, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/context/app-provider';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

export default function ExpenseArchivePage() {
  const { expenseReports } = useAppContext();
  const isLoading = !expenseReports;

  const sortedReports = useMemo(() => {
    if (!expenseReports) return [];
    return [...expenseReports].sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }, [expenseReports]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ashley-expenses"><ArrowLeft /></Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">Expense Report Archive</h1>
      </header>
      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent className="space-y-3"><Skeleton className="h-4 w-full" /></CardContent>
                <CardFooter><Skeleton className="h-8 w-24" /></CardFooter>
              </Card>
            ))}
          </div>
        ) : sortedReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedReports.map(report => (
              <Card key={report.id} className="hover:border-primary/50 hover:shadow-lg transition-all h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg leading-tight">{report.reportName}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4" />
                    {format(parseISO(report.reportDate), 'PPP')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <DollarSign className="w-6 h-6" />
                    {formatCurrency(report.totalAmount)}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/expenses/archive/${report.id}`}><Eye className="mr-2"/>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Expense Reports Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">Create your first expense report to see it here.</p>
            <Button asChild className="mt-4"><Link href="/expenses/add">Create Report</Link></Button>
          </div>
        )}
      </main>
    </div>
  );
}
