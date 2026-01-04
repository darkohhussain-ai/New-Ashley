
'use client';

import { Calendar, Truck, Package } from "lucide-react";
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import type { Transfer } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";


type TransferPdfCardProps = {
  transfer: Transfer;
  logoSrc: string | null;
  totalItems: number;
};

export function TransferPdfCard({ transfer, logoSrc, totalItems }: TransferPdfCardProps) {
  const { t } = useTranslation();
  
  const formattedDate = transfer.transferDate ? format(parseISO(transfer.transferDate), 'MMMM d, yyyy') : 'N/A';

  return (
    <div className="bg-white text-black w-full p-4 font-sans border-2 border-gray-200 rounded-xl" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{t('cargo_transfer_slip')}</h1>
          <p className="text-lg font-semibold text-blue-600">{transfer.cargoName}</p>
        </div>
        <div className="w-[80px] h-[80px] flex items-center justify-center">
            {logoSrc && <Image src={logoSrc} alt={t('company_logo')} width={60} height={60} className="object-contain" />}
        </div>
      </div>
      
      {/* Details Section */}
      <div className="grid grid-cols-3 gap-4 py-4 text-sm border-b-2 border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
          <Truck className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">{t('destination')}</p>
            <p className="font-semibold">{transfer.destinationCity}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">{t('transfer_date')}</p>
            <p className="font-semibold">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
            <Package className="w-4 h-4 text-gray-500" />
            <div>
                <p className="text-xs text-gray-500">{t('total_items')}</p>
                <p className="font-semibold">{totalItems}</p>
            </div>
        </div>
      </div>
    </div>
  );
};
