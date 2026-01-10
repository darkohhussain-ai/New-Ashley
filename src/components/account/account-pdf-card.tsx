
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import type { Employee } from "@/lib/types";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

type AccountPdfCardProps = {
  employee: Employee;
  logoSrc: string | null;
  selectedDate: Date;
};

export function AccountPdfCard({ employee, logoSrc, selectedDate }: AccountPdfCardProps) {
  const { t, language } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedDate = isMounted ? format(selectedDate, 'MMMM yyyy') : '...';
  const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;

  return (
    <div className="bg-white text-black w-full p-6 font-sans border-2 border-gray-200" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{t('employee_report')}</h1>
          <p className="text-lg font-semibold text-blue-600">{formattedDate}</p>
        </div>
        <div className="w-[80px] h-[80px] flex items-center justify-center">
          {logoSrc && <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="object-contain" />}
        </div>
      </div>
      
      {/* Employee Details Section */}
      <div className="flex items-center gap-6 py-4">
        <Avatar className="w-24 h-24 border-4 border-gray-200">
          <AvatarImage src={employee.photoUrl} alt={employee.name} />
          <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-sm">
            <h2 className="text-xl font-bold text-gray-800" dir={language === 'ku' ? 'rtl' : 'ltr'}>{displayName}</h2>
            <p className="text-gray-600" dir={language === 'ku' ? 'rtl' : 'ltr'}>{employee.role || 'Employee'}</p>
            <div className="mt-2 space-y-1 text-gray-700">
                {employee.email && <p className="flex items-center gap-2"><Mail className="w-3 h-3"/> {employee.email}</p>}
                {employee.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3"/> {employee.phone}</p>}
                {employee.employmentStartDate && <p className="flex items-center gap-2"><CalendarIcon className="w-3 h-3"/> Joined: {format(parseISO(employee.employmentStartDate), 'PP')}</p>}
            </div>
        </div>
      </div>
    </div>
  );
};
