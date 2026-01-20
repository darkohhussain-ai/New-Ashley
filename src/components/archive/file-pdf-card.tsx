

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
    <div className="bg-white text-black w-full p-4 font-sans border border-gray-400 rounded-lg">
      {/* Header */}
      <header className="p-2 text-center text-white font-bold" style={{backgroundColor: '#22c55e'}}>
          <h1>{file.storageName}</h1>
      </header>
      <div className="flex justify-between items-center my-4 px-2">
          <div className="w-24 h-12 relative">
            {logoSrc ? <Image src={logoSrc} alt="logo" fill objectFit="contain" /> : <p className="text-gray-400">logo</p>}
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">Date: {formattedDate}</p>
             <p>Category: {file.categoryName}</p>
          </div>
      </div>
      
      {/* Details Section */}
      <div className="grid grid-cols-2 gap-4 py-4 text-sm border-t">
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
      </div>
    </div>
  );
};
