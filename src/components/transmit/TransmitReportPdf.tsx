
'use client';
import { ItemForTransfer, Transfer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import type { PdfSettings } from '@/lib/types';


export const TransmitReportPdf = ({ transfer, items, settings }: { transfer: Partial<Transfer>; items: ItemForTransfer[]; settings: PdfSettings }) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';

    const reportTitle = transfer.destinationCity ? t('transmit_report_title', { city: transfer.destinationCity }) : t('transmit_cargo');
    const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A';
    
    const { logo, fontSize, branchColors, themeColor: defaultThemeColor } = settings;

    const finalThemeColor = (transfer.destinationCity && branchColors?.[transfer.destinationCity as keyof typeof branchColors]) || defaultThemeColor || '#f97316';


    return (
        <div className="bg-white text-black p-4 font-sans" style={{ fontSize: `${fontSize}px` }} dir={useKurdish ? 'rtl' : 'ltr'}>
            <header className="flex justify-between items-center mb-4 p-2" style={{ backgroundColor: finalThemeColor, color: 'white' }}>
                 <div className="w-24 h-12 relative">
                    {logo && <Image src={logo} alt="logo" fill className="object-contain" />}
                </div>
                <h1 className="text-2xl font-bold">{reportTitle}</h1>
                <div className="w-24 text-right text-xs">
                    <p>{t('date')}: {formattedDate}</p>
                </div>
            </header>
            
            {transfer.driverName && (
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 text-sm border-b">
                    <p><strong>{t('destination')}:</strong> {transfer.destinationCity}</p>
                    <p><strong>{t('driver')}:</strong> {transfer.driverName}</p>
                    <p><strong>{t('manager')}:</strong> {transfer.warehouseManagerName}</p>
                </div>
            )}

            <div className="border border-black mt-4">
                <Table>
                    <TableHeader>
                        <TableRow style={{ backgroundColor: finalThemeColor, color: 'white' }}>
                            <TableHead className="text-white border-black border w-8">No.</TableHead>
                            <TableHead className="text-white border-black border">{t('request_date')}</TableHead>
                            <TableHead className="text-white border-black border">{t('model')}</TableHead>
                            <TableHead className="text-white border-black border w-16">{t('quantity')}</TableHead>
                            <TableHead className="text-white border-black border">{t('invoice_no')}</TableHead>
                            <TableHead className="text-white border-black border">{t('storage')}</TableHead>
                            <TableHead className="text-white border-black border w-16">{t('transmit')}</TableHead>
                            <TableHead className="text-white border-black border w-1/3">{t('notes')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={item.id} className="h-10">
                                <TableCell className="border border-black text-center p-1">{index + 1}</TableCell>
                                <TableCell className="border border-black p-1">{item.requestDate ? format(parseISO(item.requestDate), 'yyyy-MM-dd') : ''}</TableCell>
                                <TableCell className="border border-black p-1">{item.model}</TableCell>
                                <TableCell className="border border-black p-1 text-center">{item.quantity}</TableCell>
                                <TableCell className="border border-black p-1">{item.invoiceNo || ''}</TableCell>
                                <TableCell className="border border-black p-1">{item.storage || ''}</TableCell>
                                <TableCell className="border border-black p-1 text-center"><div className="w-4 h-4 border border-black mx-auto" /></TableCell>
                                <TableCell className="border border-black p-1">{item.notes || ''}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <footer className="mt-16 flex justify-end">
                <div className="w-48 text-center">
                    <div className="border-t border-black w-full"></div>
                    <p className="mt-1 text-sm">{t('warehouse_manager_signature')}</p>
                </div>
            </footer>
        </div>
    );
};
