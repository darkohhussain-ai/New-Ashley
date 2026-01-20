
'use client';
import { ItemForTransfer, Transfer } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/use-translation';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';

export const TransmitReportPdf = ({ transfer, items, logoSrc, themeColor }: { transfer: Partial<Transfer>; items: ItemForTransfer[]; logoSrc: string | null; themeColor: string }) => {
    const { t, language } = useTranslation();
    const useKurdish = language === 'ku';

    const reportTitle = transfer.destinationCity ? t('transmit_report_title', { city: transfer.destinationCity }) : t('transmit_cargo');
    const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'PPP') : 'N/A';

    return (
        <div className="bg-white text-black p-4 font-sans text-sm" dir={useKurdish ? 'rtl' : 'ltr'}>
            <header className="flex justify-between items-center mb-4 p-2" style={{ backgroundColor: themeColor, color: 'white' }}>
                <div className="w-24 h-12 relative">
                    {logoSrc && <Image src={logoSrc} alt="logo" fill className="object-contain" />}
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
                        <TableRow style={{ backgroundColor: themeColor, color: 'white' }}>
                            <TableHead className="text-white border-black border w-8">No.</TableHead>
                            <TableHead className="text-white border-black border">{t('model')}</TableHead>
                            <TableHead className="text-white border-black border w-16">{t('quantity')}</TableHead>
                            <TableHead className="text-white border-black border w-24">{t('invoice_no')}</TableHead>
                            <TableHead className="text-white border-black border w-24">{t('storage')}</TableHead>
                            <TableHead className="text-white border-black border w-16">{t('transmit')}</TableHead>
                            <TableHead className="text-white border-black border w-[30%]">{t('notes')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 23 }).map((_, index) => {
                            const item = items[index];
                            return (
                                <TableRow key={index} className="h-10">
                                    <TableCell className="border border-black text-center">{index + 1}</TableCell>
                                    <TableCell className="border border-black p-1">{item?.model || ''}</TableCell>
                                    <TableCell className="border border-black p-1 text-center">{item?.quantity || ''}</TableCell>
                                    <TableCell className="border border-black p-1">{item?.invoiceNo || ''}</TableCell>
                                    <TableCell className="border border-black p-1">{item?.storage || ''}</TableCell>
                                    <TableCell className="border border-black p-1 text-center"><div className="w-4 h-4 border border-black mx-auto" /></TableCell>
                                    <TableCell className="border border-black p-1">{item?.notes || ''}</TableCell>
                                </TableRow>
                            );
                        })}
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
