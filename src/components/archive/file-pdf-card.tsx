
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { User, Calendar, Building } from "lucide-react";
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Employee, ExcelFile } from "@/lib/types";
import { useEffect, useState } from "react";


type ChartData = { name: string, value: number, fill: string }[];

type FilePdfCardProps = {
  file: ExcelFile;
  employee: Employee;
  logoSrc: string | null;
  statusData: ChartData;
  conditionData: ChartData;
};

const statusChartConfig = {
  'Not Checked': { label: 'Not Checked', color: '#64748b' }, // slate-500
  Correct: { label: 'Correct', color: '#22c55e' }, // green-500
  Less: { label: 'Less', color: '#f97316' }, // orange-500
  More: { label: 'More', color: '#3b82f6' }, // blue-500
} satisfies ChartConfig;

const conditionChartConfig = {
  'Not Damaged': { label: 'Not Damaged', color: '#22c55e' }, // green-500
  Wrapped: { label: 'Wrapped', color: '#f59e0b' }, // amber-500
  Damaged: { label: 'Damaged', color: '#ef4444' }, // red-500
} satisfies ChartConfig;


const ChartWithSummary = ({ title, data, config }: { title: string, data: ChartData, config: ChartConfig }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="flex flex-col items-center">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{title}</h3>
            <div className="w-[150px] h-[100px]">
                <ResponsiveContainer>
                    <PieChart>
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                fontSize: '12px'
                            }}
                            formatter={(value: number, name: string) => [`${value} (${(value / total * 100).toFixed(0)}%)`, name]}
                        />
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={20} outerRadius={35} strokeWidth={2}>
                           {data.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-1 w-full text-center">
                {data.map(item => (
                     <div key={item.name} className="flex justify-center items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config[item.name]?.color }}></div>
                        <span>{item.name}:</span>
                        <span className="font-medium">{item.value}</span>
                     </div>
                ))}
            </div>
        </div>
    )
}

export function FilePdfCard({ file, employee, logoSrc, statusData, conditionData }: FilePdfCardProps) {
  const [formattedDate, setFormattedDate] = useState('N/A');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const safeDate = (dateValue: string | undefined): Date | null => {
        if (!dateValue) return null;
        const parsed = parseISO(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      };
      
      const safeFileDate = safeDate(file.date);
      setFormattedDate(safeFileDate ? format(safeFileDate, 'MMMM d, yyyy') : 'N/A');
    }
  }, [file.date, isMounted]);

  return (
    <div className="bg-white text-black w-full p-4 font-sans border-2 border-gray-200 rounded-xl" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{file.storageName}</h1>
          <p className="text-lg font-semibold text-green-600">{file.categoryName}</p>
        </div>
        <div className="w-[80px] h-[80px] flex items-center justify-center">
            {logoSrc && <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="object-contain" />}
        </div>
      </div>
      
      {/* Details Section */}
      <div className="grid grid-cols-3 gap-4 py-4 text-sm">
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
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="font-semibold">{isMounted ? formattedDate : '...'}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {(statusData.length > 0 || conditionData.length > 0) && (
        <div className="grid grid-cols-2 gap-4 py-4 border-t-2 border-gray-200">
            {statusData.length > 0 && <ChartWithSummary title="Inventory Status" data={statusData} config={statusChartConfig} />}
            {conditionData.length > 0 && <ChartWithSummary title="Condition Status" data={conditionData} config={conditionChartConfig} />}
        </div>
      )}
    </div>
  );
};
