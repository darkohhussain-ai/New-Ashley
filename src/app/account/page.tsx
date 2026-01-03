
'use client';

import Link from 'next/link';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

export default function AccountPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_dashboard')}</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{t('my_account')}</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-6 h-6" />
              {t('account_details')}
            </CardTitle>
            <CardDescription>
              {t('account_details_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('patience_thank_you')}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
