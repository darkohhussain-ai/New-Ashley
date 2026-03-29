'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backHref = '/',
  backLabel = 'Back',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/60",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              asChild 
              className="shrink-0"
            >
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">{backLabel}</span>
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
