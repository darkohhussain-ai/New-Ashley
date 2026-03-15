
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box, PackageCheck } from 'lucide-react';

const COLORS = {
  'Correct': 'hsl(var(--chart-2))',
  'Less': 'hsl(var(--chart-4))',
  'More': 'hsl(var(--chart-1))',
  '': 'hsl(var(--muted))',
};
const STATUS_NAMES = {
  'Correct': 'Correct',
  'Less': 'Less',
  'More': 'More',
  '': 'Not Set'
};

type StatusKey = keyof typeof COLORS;

export function StorageSummaryChart() {
  const { t } = useTranslation();
  const { items } = useAppContext();

  const chartData = useMemo(() => {
    if (!items || items.length === 0) return [];

    const statusCounts = items.reduce((acc, item) => {
      const status = item.storageStatus || '';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts)
        .map(([name, value]) => ({
            name: t(STATUS_NAMES[name as StatusKey]?.toLowerCase() || name.toLowerCase()) || STATUS_NAMES[name as StatusKey] || name,
            value,
            fill: COLORS[name as StatusKey] || COLORS[''],
        }))
        .filter(item => item.value > 0);

  }, [items, t]);

  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-xl flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            {t('storage_status_overview')}
        </CardTitle>
        <CardDescription>{t('storage_status_overview_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                paddingAngle={5}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} items`, 'Count']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center space-y-3">
            <PackageCheck className="w-10 h-10 text-muted-foreground opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">{t('no_storage_data_available')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
