
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
    <div className="bg-white text-black w-full p-4 font-sans border border-gray-400 rounded-lg">
       <header
          className="p-4 flex justify-between items-center"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <div className="w-20 h-20 relative">
            {logoSrc ? (
              <Image src={logoSrc} alt="logo" fill className="object-contain" />
            ) : (
              <div className="w-20 h-20 bg-white/20 rounded-md flex items-center justify-center text-white/50">
                <span>{t('logo')}</span>
              </div>
            )}
          </div>
          <div className="text-center text-white">
            <h1 className="text-xl font-bold">{t('cargo_transfer_slip')}</h1>
            <p className="text-sm">{formattedDate}</p>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </header>
      
      {/* Details Section */}
       <div className="py-4">
            <h2 className="font-bold text-lg mb-2">{transfer.cargoName}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <p className="flex gap-2 items-center"><Truck className="w-4 h-4 text-primary"/> <strong>{t('destination')}:</strong> {transfer.destinationCity}</p>
                <p className="flex gap-2 items-center"><Package className="w-4 h-4 text-primary"/> <strong>{t('total_items')}:</strong> {totalItems}</p>
            </div>
       </div>
    </div>
  );
};
