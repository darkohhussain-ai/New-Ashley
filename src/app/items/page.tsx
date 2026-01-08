
"use client";

import Link from 'next/link';
import { ArrowLeft, MapPin, FilePlus, Upload, Archive, FileText, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';

function ItemsPage() {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const canEdit = hasPermission('page:admin');

    const menuItems = [
    {
      title: t("manage_locations"),
      icon: MapPin,
      href: "/locations",
      color: "bg-pink-500",
      enabled: true
    },
    {
      title: t("new_excel_file"),
      icon: FilePlus,
      href: "/new-file",
      color: "bg-blue-500",
      enabled: canEdit
    },
    {
      title: t("import_excel_file"),
      icon: Upload,
      href: "/import",
      color: "bg-teal-500",
      enabled: canEdit
    },
    {
      title: t("excel_archive"),
      icon: Archive,
      href: "/archive",
      color: "bg-yellow-500",
      enabled: true
    },
    {
      title: t("pdf_archive"),
      icon: FileText,
      href: "/pdf-archive",
      color: "bg-purple-500",
      enabled: true
    },
    {
      title: t("sold_items_check"),
      icon: ShoppingCart,
      href: "/sold-items",
      color: "bg-orange-500",
      enabled: canEdit
    }
  ];

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
          <h1 className="text-xl">{t('placement_storage')}</h1>
        </div>
      </header>
      <main className='container mx-auto p-4 md:p-8'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.filter(item => item.enabled).map((item) => (
            <Link key={item.title} href={item.href} className="group block" passHref>
                <Card className={cn("h-48 flex flex-col items-center justify-center text-white transition-transform transform hover:-translate-y-1 hover:shadow-xl", item.color)}>
                  <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="p-4 bg-white/20 rounded-full mb-4">
                        <item.icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(ItemsPage);
