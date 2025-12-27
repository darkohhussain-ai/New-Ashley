'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Cake } from "lucide-react";
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import type { Employee } from "@/lib/types";

type EmployeePdfCardProps = {
  employee: Employee;
  logoSrc: string;
};

export function EmployeePdfCard({ employee, logoSrc }: EmployeePdfCardProps) {
  
  const safeDate = (dateValue: string | undefined): Date | null => {
    if (!dateValue) return null;
    const parsed = parseISO(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  const safeDateOfBirth = safeDate(employee.dateOfBirth);
  const formattedDob = safeDateOfBirth ? format(safeDateOfBirth, 'dd/MM/yyyy') : 'N/A';

  return (
    <div className="bg-white text-black w-[350px] p-0 font-sans" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div className="relative border-gray-200 border-2 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-gray-100 p-4 flex justify-center items-center h-[80px]">
          {logoSrc && <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="object-contain" />}
        </div>
        
        {/* Orange Accent Bar */}
        <div className="h-1.5 bg-orange-500"></div>
        
        {/* Photo and Name Section */}
        <div className="relative pt-12 pb-6 bg-white text-center">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg ring-2 ring-gray-200">
                  <AvatarImage src={employee.photoUrl} alt={employee.name} />
                  <AvatarFallback className="text-4xl bg-gray-200 text-gray-700">
                    <User />
                  </AvatarFallback>
                </Avatar>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mt-2">{employee.name}</h1>
            <p className="text-sm text-gray-500">{employee.jobTitle || 'Employee'}</p>
        </div>
        
        {/* Details Section */}
        <div className="px-4 pb-6 bg-white">
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">ID NO</span>
              <span className="font-mono">{employee.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">D.O.B</span>
              <span>{formattedDob}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Email</span>
              <span>{employee.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-500">Phone</span>
              <span>{employee.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Barcode and Footer Section */}
        <div className="relative px-4 pt-4 pb-4 bg-gray-100">
            <svg className="absolute top-0 left-0 w-full h-auto text-orange-500 -translate-y-full" viewBox="0 0 100 20" preserveAspectRatio="none" style={{filter: 'drop-shadow(0 -5px 3px rgba(0,0,0,0.05))'}}>
              <path d="M0,20 C30,0 70,0 100,20 Z" fill="white"/>
            </svg>
            <div className="relative z-10 flex flex-col items-center">
                <Image src="https://barcode.tec-it.com/barcode.ashx?data=123456789012&code=Code128&imagetype=svg" alt="Barcode" width={150} height={30} className="object-contain"/>
                <p className="text-xs font-bold mt-2 text-gray-600">COMPANY NAME</p>
                <p className="text-[10px] text-gray-400">TAGLINE GOES HERE</p>
            </div>
        </div>

      </div>
    </div>
  );
};
