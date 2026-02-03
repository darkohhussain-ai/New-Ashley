'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-provider';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Box } from 'lucide-react';
import { Item } from '@/lib/types';

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
    if (!items) return [];

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Box /> {t('storage_status_overview')}</CardTitle>
        <CardDescription>{t('storage_status_overview_desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} items`, 'Count']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t('no_storage_data_available')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
