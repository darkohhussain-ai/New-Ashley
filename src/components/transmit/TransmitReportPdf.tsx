
'use client';
import { ItemForTransfer, Transfer, PdfSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import { format, parseISO } from 'date-fns';
import { ReportWrapper } from '@/components/reports/ReportWrapper';

export const TransmitReportPdf = ({ transfer, items, settings }: { transfer: Partial<Transfer>; items: ItemForTransfer[]; settings: PdfSettings }) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';
    
    const reportTitleTemplate = settings.titleTemplate || t('transmit_report_title', { city: '{city}' });
    const reportTitle = reportTitleTemplate.replace('{city}', transfer.destinationCity || 'N/A');
    const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A';
    
    const { logo, branchColors, themeColor: defaultThemeColor } = settings;
    const finalThemeColor = (transfer.destinationCity && branchColors?.[transfer.destinationCity as keyof typeof branchColors]) || defaultThemeColor || '#f97316';

    return (
        <ReportWrapper
            title={reportTitle}
            date={formattedDate}
            logoSrc={logo}
            themeColor={finalThemeColor}
        >
            <div className="p-2" dir={useKurdish ? 'rtl' : 'ltr'}>
                {transfer.driverName && (
                    <div className="grid grid-cols-3 gap-x-4 gap-y-2 py-4 text-sm border-b">
                        <p><strong>{t('destination')}:</strong> {transfer.destinationCity}</p>
                        <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                        <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                    </div>
                )}

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow style={{ backgroundColor: finalThemeColor, color: 'white' }}>
                                <TableHead className="text-white w-[5%]">No.</TableHead>
                                <TableHead className="text-white w-[25%]">{t('model')}</TableHead>
                                <TableHead className="text-white w-[5%]">{t('quantity')}</TableHead>
                                <TableHead className="text-white w-[10%]">{t('invoice_no')}</TableHead>
                                <TableHead className="text-white w-[10%]">{t('storage')}</TableHead>
                                <TableHead className="text-white w-[5%]">{t('transmit')}</TableHead>
                                <TableHead className="text-white w-[25%]">{t('notes')}</TableHead>
                                <TableHead className="text-white w-[15%]">{t('request_date')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item.id} className={settings.tableTheme === 'striped' ? 'odd:bg-muted/30' : ''}>
                                    <TableCell className="text-center p-1">{index + 1}</TableCell>
                                    <TableCell className="p-1">{item.model}</TableCell>
                                    <TableCell className="p-1 text-center">{item.quantity}</TableCell>
                                    <TableCell className="p-1">{item.invoiceNo || ''}</TableCell>
                                    <TableCell className="p-1">{item.storage || ''}</TableCell>
                                    <TableCell className="p-1 text-center"><div className="w-4 h-4 border border-black mx-auto" /></TableCell>
                                    <TableCell className="p-1">{item.notes || ''}</TableCell>
                                    <TableCell className="p-1">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </ReportWrapper>
    );
};
