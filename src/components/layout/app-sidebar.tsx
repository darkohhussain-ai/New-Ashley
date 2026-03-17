
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
    <div className="flex flex-col items-center gap-0.5 text-white/70">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">
        <Calendar className="w-2.5 h-2.5" />
        <span>{format(time, 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-black tabular-nums text-white tracking-widest">
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
    <Sidebar side={side} collapsible="icon" className="border-none shadow-2xl bg-black/40 backdrop-blur-2xl print:hidden">
      <SidebarHeader className="p-4 bg-transparent border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
            <div className="w-8 h-8 flex items-center justify-center">
                <SidebarTrigger className="text-white hover:bg-white/20 transition-all" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
                <Badge variant="outline" className="text-[8px] font-black tracking-widest border-primary/50 text-primary-foreground uppercase">Terminal Link</Badge>
            </div>
        </div>
        
        <div className="group-data-[collapsible=icon]:hidden flex flex-col items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-700">
            {settings.appLogo && (
                <div className="relative w-full h-28 bg-white rounded-2xl p-4 shadow-2xl ring-4 ring-black/20 overflow-hidden group/logo">
                    <Image
                        src={settings.appLogo}
                        alt="Logo"
                        fill
                        className="object-contain transition-transform group-hover/logo:scale-110 duration-500"
                        unoptimized
                    />
                </div>
            )}
            <DateTimeDisplay />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent text-white scrollbar-none">
        {/* Compact User Section */}
        <div className="px-4 py-4 group-data-[collapsible=icon]:hidden">
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10 shadow-inner group/user cursor-default">
                <Avatar className="w-9 h-9 border-2 border-white/20 ring-2 ring-primary/30 group-hover/user:ring-primary transition-all">
                    <AvatarFallback className="bg-primary/20 text-white font-black text-xs">
                        {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black uppercase tracking-widest truncate leading-tight text-white/90">{user?.username}</p>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">Authorized Operator</p>
                </div>
            </div>
        </div>

        {/* Action Grid */}
        <div className="px-4 mb-6 grid grid-cols-2 gap-2 group-data-[collapsible=icon]:hidden">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-full bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50">
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ku' ? 'KU' : 'EN'}</span>
                        <span className="text-[7px] opacity-40 uppercase tracking-tighter">{t('language')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-black/90 border-white/10 text-white">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-xs font-bold hover:bg-white/10">English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ku')} className="text-xs font-bold hover:bg-white/10">کوردی</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                variant="ghost" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-10 w-full bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5">{t('theme')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="h-10 w-full bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                <Home className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5">{t('home')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="h-10 w-full bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5">{t('back')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => window.print()}
                className="h-10 w-full bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                <Printer className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5">{t('print')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={logout}
                className="h-10 w-full bg-red-500/10 hover:bg-red-500/30 text-red-200 border border-red-500/20 rounded-xl flex flex-col items-center justify-center p-0 transition-all"
            >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5">{t('logout')}</span>
            </Button>
        </div>

        <Separator className="bg-white/10 mb-4 mx-4 w-auto group-data-[collapsible=icon]:hidden" />

        {navigation.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="text-white/20 text-[9px] uppercase font-black tracking-[0.3em] px-6 mb-2 group-data-[collapsible=icon]:hidden">
                {t(group.label.toLowerCase()) || group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href} className="px-3 mb-1">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                        className={cn(
                            "rounded-xl transition-all duration-300 hover:bg-white/10 h-11 border border-transparent",
                            "data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:shadow-2xl data-[active=true]:border-white/20",
                            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-11"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center">
                          <item.icon className={cn(
                              "w-4 h-4 shrink-0 transition-transform duration-300",
                              pathname === item.href ? "scale-110" : "opacity-70"
                          )} />
                          <span className="font-black text-[11px] uppercase tracking-widest truncate group-data-[collapsible=icon]:hidden">
                            {t(item.title)}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-transparent border-t border-white/10 p-4 group-data-[collapsible=icon]:hidden">
        <div className="flex flex-col items-center gap-1 opacity-20">
            <div className="text-[10px] text-white font-black uppercase tracking-[0.4em]">
                DRP CORE
            </div>
            <div className="text-[7px] text-white font-bold uppercase tracking-widest">
                VER 2.9.5 // NEXUS
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
