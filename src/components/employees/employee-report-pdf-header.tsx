'use client';

import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { User, Mail, Phone, Calendar as CalendarIcon, ShieldCheck, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee, PdfSettings } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";

type EmployeeReportPdfHeaderProps = {
  employee: Employee;
  settings: PdfSettings;
};

export function EmployeeReportPdfHeader({ employee, settings }: EmployeeReportPdfHeaderProps) {
  const { t, language } = useTranslation();
  const displayName = language === 'ku' && employee.kurdishName ? employee.kurdishName : employee.name;

  const safeDate = (dateValue: string | undefined): Date | null => {
    if (!dateValue) return null;
    const parsed = parseISO(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  const safeJoinedDate = safeDate(employee.employmentStartDate);
  const formattedJoinedDate = safeJoinedDate ? format(safeJoinedDate, 'MMMM d, yyyy') : t('na');

  return (
    <div className="bg-white text-black w-full p-6 font-sans border-b-2 border-gray-200" style={{ fontFamily: (settings.customFont && language === 'ku') ? 'CustomPdfFont' : (settings.font || 'sans-serif') }}>
       {settings.headerText && (
        <div className="text-center text-xs text-gray-500 pb-2 border-b mb-4">
          {settings.headerText}
        </div>
      )}
      {/* Main Header */}
      <div className="flex justify-between items-center pb-4">
        <div dir={language === 'ku' ? 'rtl' : 'ltr'}>
          <h1 className="text-2xl font-bold text-gray-800">{t('employee_report')}</h1>
          <p className="text-sm text-gray-500">{t('as_of')} {format(new Date(), 'MMMM d, yyyy')}</p>
        </div>
        <div className="w-20 h-20 flex items-center justify-center">
          {settings.logo && <Image src={settings.logo} alt="Company Logo" width={80} height={80} className="object-contain" />}
        </div>
      </div>

      {/* Employee Info Section */}
      <div className="flex items-start gap-6 pt-4 border-t-2 border-gray-100" dir={language === 'ku' ? 'rtl' : 'ltr'}>
        <Avatar className="w-24 h-24 rounded-md border-2 border-gray-200">
          <AvatarImage src={employee.photoUrl} alt={employee.name} />
          <AvatarFallback><User className="w-12 h-12" /></AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
            {employee.role && (
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gray-500" /> <strong>{t('role')}:</strong> {employee.role}</p>
            )}
            {employee.employeeId && (
              <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-500" /> <strong>{t('id_colon')}</strong> {employee.employeeId}</p>
            )}
            {employee.email && (
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" /> {employee.email}</p>
            )}
            {employee.phone && (
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> {employee.phone}</p>
            )}
            <p className="flex items-center gap-2 col-span-2"><CalendarIcon className="w-4 h-4 text-gray-500" /> <strong>{t('joined_on')}:</strong> {formattedJoinedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
