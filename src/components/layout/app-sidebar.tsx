
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  PackagePlus,
  Box,
  Star,
  Users,
  UserCircle,
  ShieldCheck,
  Settings,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const pathname = usePathname();

  const navigation = [
    {
      label: 'Dashboard',
      items: [
        {
          title: 'Dashboard',
          icon: LayoutDashboard,
          href: '/',
          permission: 'admin:all',
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          title: 'ashley_employees_management',
          icon: CreditCard,
          href: '/ashley-expenses',
          permission: 'page:ashley-expenses:view',
        },
        {
          title: 'transmit_cargo',
          icon: PackagePlus,
          href: '/transmit',
          permission: 'page:transmit:view',
        },
        {
          title: 'placement_storage',
          icon: Box,
          href: '/items',
          permission: 'page:items:view',
        },
        {
          title: 'marketing_feedback',
          icon: Star,
          href: '/marketing-feedback',
          permission: 'page:marketing-feedback:view',
        },
        {
          title: 'employees',
          icon: Users,
          href: '/employees',
          permission: 'page:employees:view',
        },
      ],
    },
    {
      label: 'System Control',
      items: [
        {
          title: 'my_account',
          icon: UserCircle,
          href: '/account',
          permission: 'page:account',
        },
        {
          title: 'settings',
          icon: Settings,
          href: '/settings',
          permission: 'page:settings',
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0 shadow-xl overflow-hidden">
      <SidebarHeader className="h-20 bg-primary flex items-center justify-center border-b border-white/10">
        <div className="font-black text-xl px-4 text-white tracking-tighter">ASHLEY STAFF</div>
      </SidebarHeader>
      <SidebarContent className="bg-primary text-white pt-4">
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-white/50 text-[10px] uppercase font-black tracking-widest px-4 mb-2">
                {t(group.label.toLowerCase().replace(/ /g, '_')) || group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href} className="px-2">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                        className={cn(
                            "rounded-xl transition-all duration-300 hover:bg-white/10 active:scale-95",
                            "data-[active=true]:bg-white data-[active=true]:text-primary data-[active=true]:shadow-lg"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span className="font-bold">{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-primary border-t border-white/10 p-6">
        <div className="text-[10px] text-white/40 text-center uppercase font-black tracking-[0.2em]">
          DRP Terminal v2.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
