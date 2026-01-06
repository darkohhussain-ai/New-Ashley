
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Cake, Calendar, ShieldCheck, Briefcase } from "lucide-react";
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import type { Employee, PdfSettings } from "@/lib/types";
import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

type EmployeePdfCardProps = {
  employee: Employee;
  settings: PdfSettings;
};

export function EmployeePdfCard({ employee, settings }: EmployeePdfCardProps) {
  const { t, language } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const useKurdish = language === 'ku';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedDob = isMounted && employee.dateOfBirth ? format(parseISO(employee.dateOfBirth), 'dd/MM/yyyy') : t('na');
  const formattedJoinedDate = isMounted && employee.employmentStartDate ? format(parseISO(employee.employmentStartDate), 'dd/MM/yyyy') : t('na');
  const displayName = useKurdish && employee.kurdishName ? employee.kurdishName : employee.name;

  return (
    <div className="bg-white text-gray-800 w-[600px] h-[360px] font-sans rounded-lg shadow-lg overflow-hidden border border-gray-200 flex" style={{ fontFamily: (settings.customFont && useKurdish) ? 'CustomPdfFont' : (settings.font || 'sans-serif') }}>
      {/* Left Section - Photo and Details */}
      <div className="w-1/3 bg-gray-50 flex flex-col items-center justify-center p-4 border-r">
          <Avatar className="w-28 h-28 border-4 border-white shadow-lg rounded-md bg-gray-100 mb-4">
            <AvatarImage src={employee.photoUrl} alt={displayName} className="rounded-md" />
            <AvatarFallback className="text-4xl bg-gray-200 text-gray-700 rounded-md">
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900" dir={useKurdish ? 'rtl' : 'ltr'}>{displayName}</h2>
            <p className="text-sm text-gray-500" dir={useKurdish ? 'rtl' : 'ltr'}>{employee.role || t('employee')}</p>
          </div>
           <div className="mt-4 text-xs text-left w-full space-y-2">
                <p className="flex items-center gap-2 truncate"><Mail className="w-3 h-3 shrink-0"/>{employee.email || t('na')}</p>
                <p className="flex items-center gap-2"><Phone className="w-3 h-3 shrink-0"/>{employee.phone || t('na')}</p>
           </div>
      </div>
      
      {/* Right Section - Header and Info */}
      <div className="w-2/3 flex flex-col">
          {/* Header Section */}
          <div 
            className="relative h-24 text-white p-4 flex justify-between items-center"
            style={{ backgroundColor: settings.themeColor || '#3b82f6' }}
          >
             <div
                className="absolute inset-0 opacity-20"
                style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                }}
             ></div>
            <div className="z-10">
                <h1 className="font-bold text-xl uppercase">{employee.role || t('employee').toLocaleUpperCase()}</h1>
                {settings.headerText && <p className="text-xs opacity-90">{settings.headerText}</p>}
            </div>
            <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md z-10">
                <div className="w-12 h-12 relative">
                    {settings.logo ? (
                        <Image src={settings.logo} alt="Company Logo" fill className="object-contain" />
                    ) : (
                        <span className='text-xs text-center text-gray-500'>{t('logo')}</span>
                    )}
                </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="relative bg-white p-4 flex-grow flex flex-col">
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mt-4" dir={useKurdish ? 'rtl' : 'ltr'}>
                  <div><p className="text-gray-500 text-xs">{t('id_no')}</p><p className="font-semibold">{employee.employeeId || t('na')}</p></div>
                  <div><p className="text-gray-500 text-xs">{t('joined_date')}</p><p className="font-semibold">{formattedJoinedDate}</p></div>
                  <div><p className="text-gray-500 text-xs">{t('dob')}</p><p className="font-semibold">{formattedDob}</p></div>
                  <div><p className="text-gray-500 text-xs">{t('expire_date')}</p><p className="font-semibold">{t('na')}</p></div>
              </div>
              
              {/* Signature & QR Area */}
              <div className="mt-auto pt-4 flex justify-between items-end">
                  <div className="text-left" dir={useKurdish ? 'rtl' : 'ltr'}>
                      <p className="text-xs text-gray-500">{t('employee_signature')}</p>
                      <div className="w-32 h-8 border-b border-gray-400"></div>
                  </div>
                  <div className="flex flex-col items-center">
                      <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${employee.id}`} alt="QR Code" width={60} height={60} />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
