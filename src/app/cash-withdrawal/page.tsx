'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, Calendar, Archive, BarChart as BarChartIcon, Printer, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import withAuth from '@/hooks/withAuth';
import { useState, useMemo, useRef } from 'react';
import { useAppContext } from '@/context/app-provider';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);

function CashWithdrawalDashboardPage() {
  const { t } = useTranslation();
  const { withdrawals, employees } = useAppContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const contentRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { title: t('add_daily_withdrawal'), icon: Plus, href: "/cash-withdrawal/add", color: "bg-blue-500" },
    { title: t('monthly_withdrawal_report'), icon: Calendar, href: "/cash-withdrawal/monthly-report", color: "bg-orange-500" },
    { title: t('withdrawal_archive'), icon: Archive, href: "/cash-withdrawal/archive", color: "bg-teal-500" },
  ];
  
  const monthlyData = useMemo(() => {
    if (!withdrawals || !employees || !selectedDate) return [];

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    
    const filteredRecords = withdrawals.filter(r => r.date && isWithinInterval(parseISO(r.date), { start, end }));
    
    const employeeTotals = new Map<string, { totalAmount: number }>();
    filteredRecords.forEach(record => {
      const current = employeeTotals.get(record.employeeId) || { totalAmount: 0 };
      current.totalAmount += record.amount;
      employeeTotals.set(record.employeeId, current);
    });

    return Array.from(employeeTotals.entries()).map(([employeeId, totals]) => ({
      employeeName: employees.find(e => e.id === employeeId)?.name || t('unknown'),
      ...totals
    })).sort((a,b) => b.totalAmount - a.totalAmount);
  }, [withdrawals, employees, selectedDate, t]);
  
  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    const canvas = await html2canvas(contentRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'px', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfWidth * (canvas.height / canvas.width));
    pdf.save(`cash-withdrawal-summary-${format(selectedDate || new Date(), 'yyyy-MM')}.pdf`);
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col print:h-auto">
      <header className="bg-card border-b p-4 print:hidden">
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/ashley-expenses"><ArrowLeft /></Link>
                </Button>
                <h1 className="text-xl">{t('cash_withdrawal')}</h1>
            </div>
             <div className="flex items-center gap-2">
                <Button onClick={handlePrint} variant="outline"><Printer className="mr-2 h-4 w-4"/> {t('print')}</Button>
                <Button onClick={handleDownloadPdf} variant="outline"><FileDown className="mr-2 h-4 w-4"/> {t('download_pdf')}</Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-48 justify-start text-left", !selectedDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "MMMM yyyy") : <span>{t('pick_a_month')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} captionLayout="dropdown-nav" fromYear={2020} toYear={2040} />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
      </header>
      <main ref={contentRef} className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto space-y-8'>
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChartIcon /> {t('withdrawal_summary')}</CardTitle>
                <CardDescription>{t('monthly_overview_desc', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : ''})}</CardDescription>
            </CardHeader>
            <CardContent>
                {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="employeeName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${formatCurrency(value)}`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="totalAmount" name="Total Withdrawn" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">{t('no_withdrawals_found_for_month', { month: selectedDate ? format(selectedDate, 'MMMM yyyy') : '' })}</p>
                    </div>
                )}
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
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

export default withAuth(CashWithdrawalDashboardPage);
