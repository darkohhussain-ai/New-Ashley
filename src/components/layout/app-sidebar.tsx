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
  useSidebar,
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
          permission: 'admin:all', // Everyone logged in can see dashboard
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
      label: 'Management Hub',
      items: [
        {
          title: 'my_account',
          icon: UserCircle,
          href: '/account',
          permission: 'page:account',
        },
        {
          title: 'admin_panel',
          icon: ShieldCheck,
          href: '/settings?tab=admin',
          permission: 'page:admin',
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-20 border-b flex items-center justify-center">
        <div className="font-bold text-xl px-4 truncate">ASHLEY STAFF</div>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{t(group.label.toLowerCase().replace(/ /g, '_')) || group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
          DRP Terminal v1.2
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
