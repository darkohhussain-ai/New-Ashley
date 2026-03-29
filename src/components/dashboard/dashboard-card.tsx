'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type DashboardCardProps = {
  title: string;
  icon: LucideIcon;
  href: string;
  color: string;
};

export function DashboardCard({ title, icon: Icon, href, color }: DashboardCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="h-28 flex flex-col items-center justify-center text-center p-4 transition-all duration-200 hover:shadow-soft-md hover:-translate-y-0.5 border-border/60">
        <div className={cn(
          'p-2.5 rounded-xl text-white mb-3 transition-transform duration-200 group-hover:scale-105',
          color
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-foreground leading-tight line-clamp-2 px-1">
          {title}
        </span>
      </Card>
    </Link>
  );
}
