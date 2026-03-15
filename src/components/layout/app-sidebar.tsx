
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

  if (!time) return <div className="h-8 animate-pulse bg-white/10 rounded w-full" />;

  return (
    <div className="space-y-0.5 text-white/80">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <Calendar className="w-2.5 h-2.5" />
        <span>{format(time, 'MMMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-base font-black tabular-nums">
        <Clock className="w-3.5 h-3.5" />
        <span>{format(time, 'h:mm a')}</span>
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
    <Sidebar side={side} collapsible="icon" className="border-none shadow-2xl">
      <SidebarHeader className="min-h-16 bg-primary flex flex-col items-stretch justify-center p-3 gap-3 border-b border-white/10">
        <div className="flex items-center justify-between">
            <div className="font-black text-lg text-white tracking-tighter group-data-[collapsible=icon]:hidden">
                ASHLEY STAFF
            </div>
            <SidebarTrigger className="text-white hover:bg-white/10" />
        </div>
        
        <div className="group-data-[collapsible=icon]:hidden space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            {settings.appLogo && (
                <div className="relative w-full h-8">
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

      <SidebarContent className="bg-primary text-white pt-1">
        {/* User Card */}
        <div className="px-3 mb-3 group-data-[collapsible=icon]:hidden">
            <div className="bg-white/10 rounded-xl p-2 flex items-center gap-2.5 border border-white/5">
                <Avatar className="w-8 h-8 border border-white/20">
                    <AvatarFallback className="bg-white/20 text-white font-bold text-xs">
                        {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold truncate">{user?.username}</p>
                    <p className="text-[9px] text-white/60 uppercase font-black tracking-widest truncate">
                        {t('administrator')}
                    </p>
                </div>
            </div>
        </div>

        {/* Global Actions Hub */}
        <div className="px-3 mb-4 grid grid-cols-2 gap-1.5 group-data-[collapsible=icon]:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="bg-white/5 hover:bg-white/20 text-white border border-white/10 justify-start h-8 px-2">
                        <Languages className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-[11px]">{language === 'ku' ? 'کوردی' : 'English'}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-xs">English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ku')} className="text-xs">کوردی (Soranî)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="bg-white/5 hover:bg-white/20 text-white border border-white/10 justify-start h-8 px-2"
            >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5 mr-1.5" /> : <Sun className="w-3.5 h-3.5 mr-1.5" />}
                <span className="text-[11px]">{t('theme')}</span>
            </Button>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/')}
                className="bg-white/5 hover:bg-white/20 text-white border border-white/10 justify-start h-8 px-2"
            >
                <Home className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-[11px]">{t('home')}</span>
            </Button>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="bg-white/5 hover:bg-white/20 text-white border border-white/10 justify-start h-8 px-2"
            >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-[11px]">{t('back')}</span>
            </Button>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.print()}
                className="bg-white/5 hover:bg-white/20 text-white border border-white/10 justify-start h-8 px-2"
            >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-[11px]">{t('print')}</span>
            </Button>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/20 justify-start h-8 px-2"
            >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-[11px]">{t('logout')}</span>
            </Button>
        </div>

        <Separator className="bg-white/10 mb-3 mx-3 w-auto group-data-[collapsible=icon]:hidden" />

        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-white/40 text-[9px] uppercase font-black tracking-widest px-3 mb-1 group-data-[collapsible=icon]:hidden">
                {t(group.label.toLowerCase()) || group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href} className="px-1.5 mb-0.5">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                        className={cn(
                            "rounded-lg transition-all duration-300 hover:bg-white/10 active:scale-95 h-9",
                            "data-[active=true]:bg-white data-[active=true]:text-primary data-[active=true]:shadow-lg shadow-primary/20",
                            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-2.5">
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="font-bold text-xs truncate group-data-[collapsible=icon]:hidden">{t(item.title)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-primary border-t border-white/10 p-4 group-data-[collapsible=icon]:hidden">
        <div className="text-[9px] text-white/40 text-center uppercase font-black tracking-[0.2em]">
          DRP Terminal v2.5
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
