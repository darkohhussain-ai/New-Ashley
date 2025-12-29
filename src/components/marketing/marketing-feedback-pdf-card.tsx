
'use client';

import { format } from 'date-fns';
import Image from 'next/image';

type MarketingFeedbackPdfCardProps = {
  logoSrc: string | null;
  totalEvaluations: number;
};


export function MarketingFeedbackPdfCard({ logoSrc, totalEvaluations }: MarketingFeedbackPdfCardProps) {
  const formattedDate = format(new Date(), 'MMMM d, yyyy');

  return (
    <div className="bg-white text-black w-full p-4 font-sans border-2 border-gray-200 rounded-xl" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Marketing Feedback Report</h1>
          <p className="text-lg font-semibold text-gray-600">{formattedDate}</p>
        </div>
        <div className="w-[80px] h-[80px] flex items-center justify-center">
            {logoSrc && <Image src={logoSrc} alt="Company Logo" width={60} height={60} className="object-contain" />}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 py-4">
         <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500">Total Evaluations Submitted</p>
            <p className="text-4xl font-bold text-gray-800">{totalEvaluations}</p>
         </div>
      </div>
    </div>
  );
};
