
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from 'date-fns';
import type { Employee, ExcelFile, Item, StorageLocation } from "@/lib/types";
import { ReportWrapper } from "../reports/ReportWrapper";
import { useTranslation } from "@/hooks/use-translation";

type FileReportPdfProps = {
  file: ExcelFile;
  items: Item[];
  employee: Employee;
  locations: StorageLocation[];
  logoSrc: string | null;
  themeColor: string;
};

export function FilePdfCard({ file, items, employee, locations, logoSrc, themeColor }: FileReportPdfProps) {
    const { t } = useTranslation();

    const getLocationName = (id?: string) => locations?.find(l => l.id === id)?.name || 'N/A';

    return (
        <ReportWrapper
            title={file.storageName}
            date={file.date ? format(parseISO(file.date), 'PPP') : 'N/A'}
            logoSrc={logoSrc}
            themeColor={themeColor}
        >
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div><p className="text-gray-500">{t('employee')}</p><p className="font-medium">{employee.name}</p></div>
                <div><p className="text-gray-500">{t('source_location')}</p><p className="font-medium">{file.source}</p></div>
                <div><p className="text-gray-500">{t('category_name')}</p><p className="font-medium">{file.categoryName}</p></div>
                <div><p className="text-gray-500">{t('file_type')}</p><p className="font-medium">{file.type}</p></div>
            </div>

             <div className="overflow-x-auto">
                <Table className="pdf-table">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Storage Status</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead>Qty / Cond.</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items?.map((item, index) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium py-1">{item.model}</TableCell>
                                <TableCell className="py-1">{item.quantity}</TableCell>
                                <TableCell className="py-1">{item.storageStatus || 'N/A'}</TableCell>
                                <TableCell className="py-1">{item.modelCondition || 'N/A'}</TableCell>
                                <TableCell className="py-1">{item.quantityPerCondition ?? 'N/A'}</TableCell>
                                <TableCell className="py-1">{getLocationName(item.locationId)}</TableCell>
                                <TableCell className="text-gray-600 py-1 text-xs">{item.notes || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                        {(!items || items.length === 0) && (
                            <TableRow><TableCell colSpan={7} className="text-center h-24">No items found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
        </ReportWrapper>
    );
};
