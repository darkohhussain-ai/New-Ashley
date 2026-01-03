
'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <ShieldAlert className="mb-8 h-24 w-24 text-destructive" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {t('page_not_found')}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {t('page_not_found_desc')}
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/">
            {t('back_to_dashboard')}
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/settings">
            {t('contact_support')} <span aria-hidden="true">&rarr;</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
