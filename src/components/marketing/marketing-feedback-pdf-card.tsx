
'use client';

import { format } from 'date-fns';
import Image from 'next/image';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

type ChartData = { name: string; value: number; fill: string }[];

type MarketingFeedbackPdfCardProps = {
  logoSrc: string | null;
  totalEvaluations: number;
  overallScoreDistribution: ChartData;
};

const ChartWithSummary = ({ title, data }: { title: string; data: ChartData }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);

    return (
        <div className="flex flex-col items-center">
            <h3 className="font-semibold text-gray-700 text-sm mb-2">{title}</h3>
            <div className="w-[200px] h-[120px]">
                <ResponsiveContainer>
                    <PieChart>
                        <Tooltip
                            contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '12px' }}
                            formatter={(value: number) => `${value} (${(value / total * 100).toFixed(0)}%)`}
                        />
                        <Pie data={data} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} strokeWidth={2}>
                           {data.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-600 mt-2 space-y-1 w-full text-center">
                {data.map(item => (
                     <div key={item.name} className="flex justify-center items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                        <span>{item.name}:</span>
                        <span className="font-medium">{item.value}</span>
                     </div>
                ))}
            </div>
        </div>
    );
};

export function MarketingFeedbackPdfCard({ logoSrc, totalEvaluations, overallScoreDistribution }: MarketingFeedbackPdfCardProps) {
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
         <div className="flex flex-col items-center justify-center border-r">
            <p className="text-sm text-gray-500">Total Evaluations</p>
            <p className="text-4xl font-bold text-gray-800">{totalEvaluations}</p>
         </div>
        {overallScoreDistribution.length > 0 && <ChartWithSummary title="Overall Score Distribution" data={overallScoreDistribution} />}
      </div>
    </div>
  );
};

    