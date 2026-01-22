
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, Building } from "lucide-react";
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import type { Employee, ExcelFile } from "@/lib/types";
import { useEffect, useState } from "react";


type FilePdfCardProps = {
  file: ExcelFile;
  employee: Employee;
  logoSrc: string | null;
};


export function FilePdfCard({ file, employee, logoSrc }: FilePdfCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedDate = isMounted && file.date ? format(parseISO(file.date), 'MMMM d, yyyy') : 'N/A';

  return (
    <div className="bg-white text-black w-full p-4 font-sans rounded-lg border-2 border-gray-200 shadow-md">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b">
          <div className="w-20 h-12 relative">
            {logoSrc ? <Image src={logoSrc} alt="logo" fill className="object-contain" /> : <p className="text-gray-400 text-xs">logo</p>}
          </div>
          <div className="text-right">
            <h1 className="font-bold text-lg">{file.storageName}</h1>
            <p className="text-xs text-gray-500">{file.categoryName}</p>
          </div>
      </header>
      
      {/* Details Section */}
      <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Employee</p>
            <p className="font-semibold">{employee.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-700">
          <Building className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Source</p>
            <p className="font-semibold">{file.source}</p>
          </div>
        </div>
         <div className="flex items-center gap-2 text-gray-700 col-span-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
