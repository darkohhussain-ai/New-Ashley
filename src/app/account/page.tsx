'use client';

import { UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

export default function AccountPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-6 h-6" />
              {t('my_account')}
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
