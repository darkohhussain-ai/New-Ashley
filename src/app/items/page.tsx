
"use client";

import Link from 'next/link';
import { ArrowLeft, MapPin, FilePlus, Upload, Archive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import withAuth from '@/hooks/withAuth';
import { DashboardCard } from '@/components/dashboard/dashboard-card';

function ItemsPage() {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    
    const menuItems = [
    {
      title: t("manage_locations"),
      icon: MapPin,
      href: "/locations",
      color: "bg-pink-500",
      permission: 'page:items:locations',
    },
    {
      title: t("new_excel_file"),
      icon: FilePlus,
      href: "/new-file",
      color: "bg-blue-500",
      permission: 'page:items:new',
    },
    {
      title: t("import_excel_file"),
      icon: Upload,
      href: "/import",
      color: "bg-teal-500",
      permission: 'page:items:import',
    },
    {
      title: t("excel_archive"),
      icon: Archive,
      href: "/archive",
      color: "bg-yellow-500",
      permission: 'page:items:archive',
    },
    {
      title: t("pdf_archive"),
      icon: FileText,
      href: "/pdf-archive",
      color: "bg-red-500",
      permission: 'page:items:archive',
    }
  ];

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
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
      <main className='container mx-auto p-4 md:p-8 flex-1 overflow-y-auto'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.filter(item => hasPermission(item.permission)).map((item) => (
            <DashboardCard
                key={item.title}
                title={item.title}
                icon={item.icon}
                href={item.href}
                color={item.color}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuth(ItemsPage);
