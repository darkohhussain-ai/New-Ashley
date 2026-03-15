
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  PackagePlus,
  Box,
  Star,
  Users,
  UserCircle,
  Settings,
  Calendar,
  Clock,
  Home,
  ArrowLeft,
  Printer,
  Languages,
  Sun,
  Moon,
  LogOut,
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-provider';
import { useTheme } from '@/components/shared/theme-provider';
import { format } from 'date-fns';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function DateTimeDisplay() {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-6 animate-pulse bg-white/10 rounded w-full" />;

  return (
    <div className="flex flex-col gap-0.5 text-white/70">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
        <Calendar className="w-2.5 h-2.5" />
        <span>{format(time, 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-black tabular-nums text-white">
        <Clock className="w-3 h-3" />
        <span>{format(time, 'HH:mm:ss')}</span>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const { settings } = useAppContext();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const side = language === 'ku' ? 'right' : 'left';

  const navigation = [
    {
      label: 'Main',
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
      label: 'System',
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
    <Sidebar side={side} collapsible="icon" className="border-none shadow-2xl bg-primary">
      <SidebarHeader className="p-3 bg-primary border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
            <div className="font-black text-sm text-white tracking-tighter group-data-[collapsible=icon]:hidden uppercase">
                Ashley Terminal
            </div>
            <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" />
        </div>
        
        <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-3 animate-in fade-in duration-500">
            {settings.appLogo && (
                <div className="relative w-full h-10 bg-white/5 rounded-lg p-1.5">
                    <Image
                        src={settings.appLogo}
                        alt="Logo"
                        fill
                        className="object-contain brightness-0 invert"
                        unoptimized
                    />
                </div>
            )}
            <DateTimeDisplay />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-primary text-white custom-scrollbar scrollbar-none">
        {/* Compact User Section */}
        <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="bg-black/20 rounded-lg p-2 flex items-center gap-2 border border-white/5">
                <Avatar className="w-7 h-7 border border-white/10 ring-1 ring-white/5">
                    <AvatarFallback className="bg-white/10 text-white font-bold text-[10px]">
                        {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="text-[11px] font-bold truncate leading-tight">{user?.username}</p>
                    <p className="text-[8px] text-white/40 uppercase font-black tracking-widest truncate">
                        {t('administrator')}
                    </p>
                </div>
            </div>
        </div>

        {/* Symmetrical Actions Grid */}
        <div className="px-3 mb-4 grid grid-cols-2 gap-1 group-data-[collapsible=icon]:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 p-0 text-[10px] font-bold">
                        <Languages className="w-3 h-3 mr-1" />
                        {language === 'ku' ? 'KU' : 'EN'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[100px]">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-[11px]">English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ku')} className="text-[11px]">کوردی</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                variant="ghost" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-8 w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 p-0 text-[10px] font-bold"
            >
                {theme === 'light' ? <Moon className="w-3 h-3 mr-1" /> : <Sun className="w-3 h-3 mr-1" />}
                {t('theme').toUpperCase()}
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="h-8 w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 p-0 text-[10px] font-bold"
            >
                <Home className="w-3 h-3 mr-1" />
                {t('home').toUpperCase()}
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="h-8 w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 p-0 text-[10px] font-bold"
            >
                <ArrowLeft className="w-3 h-3 mr-1" />
                {t('back').toUpperCase()}
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => window.print()}
                className="h-8 w-full bg-white/5 hover:bg-white/10 text-white border border-white/5 p-0 text-[10px] font-bold"
            >
                <Printer className="w-3 h-3 mr-1" />
                {t('print').toUpperCase()}
            </Button>

            <Button 
                variant="ghost" 
                onClick={logout}
                className="h-8 w-full bg-red-500/10 hover:bg-red-500/30 text-red-200 border border-red-500/10 p-0 text-[10px] font-bold"
            >
                <LogOut className="w-3 h-3 mr-1" />
                {t('logout').toUpperCase()}
            </Button>
        </div>

        <Separator className="bg-white/5 mb-2 mx-3 w-auto group-data-[collapsible=icon]:hidden" />

        {navigation.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-white/30 text-[8px] uppercase font-black tracking-[0.2em] px-3 mb-1 group-data-[collapsible=icon]:hidden">
                {t(group.label.toLowerCase()) || group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href} className="px-2 mb-0.5">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                        className={cn(
                            "rounded-md transition-all duration-200 hover:bg-white/10 active:scale-[0.98] h-8",
                            "data-[active=true]:bg-white data-[active=true]:text-primary data-[active=true]:shadow-md",
                            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-2 px-2">
                          <item.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-bold text-[11px] truncate group-data-[collapsible=icon]:hidden">{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-primary border-t border-white/5 p-3 group-data-[collapsible=icon]:hidden">
        <div className="text-[8px] text-white/20 text-center uppercase font-black tracking-[0.3em]">
          DRP CORE v2.8.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
