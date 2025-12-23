
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar as CalendarIcon, FileText } from "lucide-react";
import { format } from 'date-fns';
import { Timestamp } from "firebase/firestore";

type Employee = {
  name: string;
  employmentStartDate: Timestamp;
  photoUrl?: string;
  notes?: string;
};

type EmployeePdfCardProps = {
  employee: Employee;
};

export function EmployeePdfCard({ employee }: EmployeePdfCardProps) {
  
  const formattedDate = employee.employmentStartDate ? format(employee.employmentStartDate.toDate(), 'MMMM d, yyyy') : 'N/A';

  return (
    <div className="bg-white text-black w-[400px] p-4 font-sans">
      <Card className="border-2 border-gray-800 rounded-lg shadow-2xl">
        <CardHeader className="text-center bg-gray-800 text-white p-4 rounded-t-lg">
          <CardTitle className="text-3xl font-bold tracking-wider">{employee.name}</CardTitle>
          <CardDescription className="text-gray-300">Employee Profile</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-center">
            <Avatar className="w-32 h-32 border-4 border-primary">
              <AvatarImage src={employee.photoUrl} alt={employee.name} />
              <AvatarFallback className="text-4xl bg-gray-200 text-gray-700">
                <User />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-6 h-6 text-gray-600" />
              <div>
                <p className="text-sm font-semibold text-gray-500">Employment Start Date</p>
                <p className="text-lg font-medium text-gray-800">{formattedDate}</p>
              </div>
            </div>
             {employee.notes && (
                <div className="flex items-start gap-4">
                    <FileText className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-gray-500">Notes</p>
                        <p className="text-base text-gray-700 whitespace-pre-wrap">{employee.notes}</p>
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
