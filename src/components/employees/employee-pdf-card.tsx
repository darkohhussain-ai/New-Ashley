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
  
  const safeJoinedDate = safeDate(employee.employmentStartDate);
  const formattedJoinedDate = safeJoinedDate ? format(safeJoinedDate, 'dd/MM/yyyy') : 'N/A';

  return (
    <div className="bg-white text-black w-[480px] font-sans" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div className="relative border-gray-200 border rounded-lg shadow-md overflow-hidden">
        
        {/* Header Section with Orange Wave */}
        <div className="relative bg-orange-400 h-28">
           {/* Abstract wave pattern */}
           <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          ></div>
          <div className="absolute top-4 right-4 bg-white p-2 rounded-md shadow-sm w-32 h-16 flex items-center justify-center">
            {logoSrc ? <Image src={logoSrc} alt="Company Logo" width={120} height={50} className="object-contain" /> : <span className='text-xs text-gray-500'>Company Logo</span>}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="relative bg-white px-6 pb-6">
            <div className="flex items-end -mt-20">
                {/* Photo */}
                <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg rounded-md bg-gray-100">
                      <AvatarImage src={employee.photoUrl} alt={employee.name} className="rounded-md" />
                      <AvatarFallback className="text-4xl bg-gray-200 text-gray-700 rounded-md">
                        <User />
                      </AvatarFallback>
                    </Avatar>
                </div>

                 {/* Name & QR */}
                <div className="flex-1 flex justify-between items-end ml-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                        <p className="text-md text-gray-500">{employee.jobTitle || 'Employee'}</p>
                    </div>
                     <div className="flex flex-col items-center">
                        <Image src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=employee-id-placeholder" alt="QR Code" width={60} height={60} />
                     </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="mt-8 grid grid-cols-3 gap-x-6 gap-y-4 text-xs border-t pt-6">
                <div><p className="text-gray-500">ID No</p><p className="font-semibold">{employee.id.substring(0, 7).toUpperCase()}</p></div>
                <div><p className="text-gray-500">Joined Date</p><p className="font-semibold">{formattedJoinedDate}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-semibold truncate">{employee.email || 'N/A'}</p></div>
                <div><p className="text-gray-500">D.O.B</p><p className="font-semibold">{formattedDob}</p></div>
                <div><p className="text-gray-500">Expire Date</p><p className="font-semibold">N/A</p></div>
                <div><p className="text-gray-500">Phone</p><p className="font-semibold">{employee.phone || 'N/A'}</p></div>
            </div>
            
            {/* Signature Area */}
            <div className="mt-6 text-right">
                <p className="text-xs text-gray-500">Your Signature</p>
                <p className="text-sm font-semibold italic text-gray-700 mt-4">Your Sincerely</p>
            </div>
        </div>

      </div>
    </div>
  );
};
