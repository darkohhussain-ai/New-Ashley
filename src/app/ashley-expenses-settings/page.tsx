
"use client"
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

export default function AshleyExpensesSettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ashley-expenses">
              <ArrowLeft />
              <span className="sr-only">{t('back_to_ashley_management')}</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{t('ashley_employees_management_settings')}</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
         <Card>
            <CardHeader>
                <CardTitle>{t('under_construction')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{t('under_construction_desc')}</p>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
