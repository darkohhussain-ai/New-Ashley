
'use client';

import { Calendar, Truck } from "lucide-react";
import { format } from 'date-fns';
import { Timestamp } from "firebase/firestore";
import Image from 'next/image';

type Transfer = {
  id: string;
  transferDate: Timestamp;
  cargoName: string;
  destinationCity: string;
  driverName: string;
  warehouseManagerName: string;
  itemIds: string[];
};

type TransferPdfCardProps = {
  transfer: Transfer;
  logoSrc: string;
  totalItems: number;
};

export function TransferPdfCard({ transfer, logoSrc, totalItems }: TransferPdfCardProps) {
  
  const safeDate = (dateValue: Timestamp | Date | undefined): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof (dateValue as Timestamp).toDate === 'function') {
      return (dateValue as Timestamp).toDate();
    }
    return null;
  }
  
  const safeTransferDate = safeDate(transfer.transferDate);
  const formattedDate = safeTransferDate ? format(safeTransferDate, 'MMMM d, yyyy') : 'N/A';

  return (
    <div className="bg-white text-black w-full p-4 font-sans border-2 border-gray-200 rounded-xl" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Cargo Transfer Slip</h1>
          <p className="text-lg font-semibold text-blue-600">{transfer.cargoName}</p>
        </div>
        <div className="w-[80px] h-[80px] flex items-center justify-center">
            {logoSrc && <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="object-contain" />}
        </div>
      </div>
      
      {/* Details Section */}
      <div className="grid grid-cols-2 gap-4 py-4 text-sm border-b-2 border-gray-200">
        <div className="flex items-center gap-2 text-gray-700">
          <Truck className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Destination</p>
            <p className="font-semibold">{transfer.destinationCity}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Transfer Date</p>
            <p className="font-semibold">{formattedDate}</p>
          </div>
        </div>
      </div>
      
      <div className="py-4">
        <p className="text-sm text-gray-500">Total Items in Cargo</p>
        <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
      </div>

    </div>
  );
};
