
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Cake, Calendar, ShieldCheck } from "lucide-react";
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
  
  const safeJoinedDate = safeDate(employee.employmentStartDate);
  const formattedJoinedDate = safeJoinedDate ? format(safeJoinedDate, 'dd/MM/yyyy') : 'N/A';

  return (
    <div className="bg-white text-gray-800 w-[360px] h-[600px] font-sans rounded-lg shadow-lg overflow-hidden border border-gray-200 flex flex-col" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header Section */}
      <div className="relative h-40 bg-orange-400">
         <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          ></div>
        <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center bg-white rounded-full w-20 h-20 shadow-md">
            <div className="w-16 h-16 relative">
                {logoSrc ? (
                    <Image src={logoSrc} alt="Company Logo" layout="fill" className="object-contain" />
                ) : (
                    <span className='text-xs text-center text-gray-500'>Company Logo</span>
                )}
            </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative bg-white px-6 pb-6 flex-grow flex flex-col">
          {/* Photo overlapping the header */}
          <div className="absolute left-6 -top-16">
              <Avatar className="w-28 h-28 border-4 border-white shadow-lg rounded-md bg-gray-100">
                <AvatarImage src={employee.photoUrl} alt={employee.name} className="rounded-md" />
                <AvatarFallback className="text-4xl bg-gray-200 text-gray-700 rounded-md">
                  <User />
                </AvatarFallback>
              </Avatar>
          </div>

          <div className="flex justify-between items-start pt-14">
              {/* Name & Title */}
              <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                  <p className="text-md text-gray-500">{employee.jobTitle || 'Employee'}</p>
              </div>
          </div>

          {/* Details Grid */}
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-4 text-xs border-t pt-6">
              <div><p className="text-gray-500">ID No</p><p className="font-semibold">{employee.id.substring(0, 7).toUpperCase()}</p></div>
              <div><p className="text-gray-500">Joined Date</p><p className="font-semibold">{formattedJoinedDate}</p></div>
              <div className="col-span-2"><p className="text-gray-500">Email</p><p className="font-semibold truncate">{employee.email || 'N/A'}</p></div>
              
              <div><p className="text-gray-500">D.O.B</p><p className="font-semibold">{formattedDob}</p></div>
              <div><p className="text-gray-500">Expire Date</p><p className="font-semibold">N/A</p></div>
              <div className="col-span-2"><p className="text-gray-500">Phone</p><p className="font-semibold">{employee.phone || 'N/A'}</p></div>
          </div>
          
          {/* Signature & QR Area */}
          <div className="mt-auto pt-6 flex justify-between items-end">
              <div className="text-left">
                  <p className="text-xs text-gray-500">Your Signature</p>
                  <p className="text-sm font-semibold italic text-gray-700 mt-4">Your Sincerely</p>
              </div>
              <div className="flex flex-col items-center ml-4">
                  <Image src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${employee.id}`} alt="QR Code" width={60} height={60} />
              </div>
          </div>
      </div>
    </div>
  );
};
