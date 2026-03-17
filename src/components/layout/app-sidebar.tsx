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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
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
import { Badge } from '@/components/ui/badge';

function DateTimeDisplay() {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-6 animate-pulse bg-muted rounded w-full" />;

  return (
    <div className="flex flex-col items-center gap-0.5 opacity-70">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">
        <Calendar className="w-2.5 h-2.5" />
        <span>{format(time, 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[12px] font-black tabular-nums tracking-widest">
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
  const { state } = useSidebar();

  const side = language === 'ku' ? 'right' : 'left';

  const navigation = [
    {
      items: [
        { title: 'Dashboard', icon: LayoutDashboard, href: '/', permission: 'admin:all' },
        { title: 'ashley_employees_management', icon: CreditCard, href: '/ashley-expenses', permission: 'page:ashley-expenses:view' },
        { title: 'transmit_cargo', icon: PackagePlus, href: '/transmit', permission: 'page:transmit:view' },
        { title: 'placement_storage', icon: Box, href: '/items', permission: 'page:items:view' },
        { title: 'marketing_feedback', icon: Star, href: '/marketing-feedback', permission: 'page:marketing-feedback:view' },
        { title: 'employees', icon: Users, href: '/employees', permission: 'page:employees:view' },
        { title: 'my_account', icon: UserCircle, href: '/account', permission: 'page:account' },
        { title: 'settings', icon: Settings, href: '/settings', permission: 'page:settings' },
      ],
    },
  ];

  return (
    <Sidebar side={side} collapsible="icon" className="border-none shadow-2xl bg-sidebar/68 backdrop-blur-2xl print:hidden">
      <SidebarHeader className="p-4 bg-transparent border-b border-sidebar-border">
        <div className="flex items-center justify-center mb-4">
            <SidebarTrigger className="hover:bg-sidebar-accent transition-all" />
        </div>
        
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-700">
            {settings.appLogo && (
                <div className={cn(
                    "relative bg-white rounded-2xl p-2 shadow-2xl ring-4 ring-black/5 overflow-hidden group/logo",
                    "w-full h-28 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
                )}>
                    <Image
                        src={settings.appLogo}
                        alt="Logo"
                        fill
                        className="object-contain transition-transform group-hover/logo:scale-110 duration-500"
                        unoptimized
                    />
                </div>
            )}
            {state === "expanded" && (
                <div className="animate-in fade-in duration-500">
                    <DateTimeDisplay />
                </div>
            )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent scrollbar-none">
        <div className="px-4 py-4 group-data-[collapsible=icon]:px-2">
            <div className="bg-sidebar-accent/30 rounded-xl p-3 flex items-center gap-3 border border-sidebar-border shadow-inner group/user cursor-default group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
                <Avatar className="w-9 h-9 border-2 border-sidebar-border ring-2 ring-primary/30 group-hover/user:ring-primary transition-all group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8">
                    <AvatarFallback className="bg-primary/20 font-black text-[10px]">
                        {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="text-[12px] font-black uppercase tracking-widest truncate leading-tight">{user?.username}</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">Authorized Operator</p>
                </div>
            </div>
        </div>

        <div className="px-4 mb-6 grid grid-cols-2 gap-2 group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:px-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-full bg-sidebar-accent/20 hover:bg-sidebar-accent border border-sidebar-border rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50">
                        <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ku' ? 'KU' : 'EN'}</span>
                        <span className="text-[7px] opacity-40 uppercase tracking-tighter group-data-[collapsible=icon]:hidden">{t('language')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-popover border-border text-popover-foreground">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-[12px] font-bold">English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ku')} className="text-[12px] font-bold">کوردی</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                variant="ghost" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-10 w-full bg-sidebar-accent/20 hover:bg-sidebar-accent border border-sidebar-border rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5 group-data-[collapsible=icon]:hidden">{t('theme')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="h-10 w-full bg-sidebar-accent/20 hover:bg-sidebar-accent border border-sidebar-border rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                <Home className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5 group-data-[collapsible=icon]:hidden">{t('home')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="h-10 w-full bg-sidebar-accent/20 hover:bg-sidebar-accent border border-sidebar-border rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5 group-data-[collapsible=icon]:hidden">{t('back')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={() => window.print()}
                className="h-10 w-full bg-sidebar-accent/20 hover:bg-sidebar-accent border border-sidebar-border rounded-xl flex flex-col items-center justify-center p-0 transition-all hover:border-primary/50"
            >
                <Printer className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5 group-data-[collapsible=icon]:hidden">{t('print')}</span>
            </Button>

            <Button 
                variant="ghost" 
                onClick={logout}
                className="h-10 w-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-xl flex flex-col items-center justify-center p-0 transition-all"
            >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-[7px] opacity-40 uppercase tracking-tighter mt-0.5 group-data-[collapsible=icon]:hidden">{t('logout')}</span>
            </Button>
        </div>

        <Separator className="bg-sidebar-border mb-4 mx-4 w-auto group-data-[collapsible=icon]:hidden" />

        {navigation.map((group, gIndex) => (
          <div key={gIndex} className="py-2">
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href} className="px-3 mb-1 group-data-[collapsible=icon]:px-1">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                        className={cn(
                            "rounded-xl transition-all duration-300 hover:bg-sidebar-accent h-11 border border-transparent",
                            "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-lg",
                            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-11"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                          <item.icon className={cn(
                              "w-4 h-4 shrink-0 transition-transform duration-300",
                              pathname === item.href ? "scale-110" : "opacity-70"
                          )} />
                          <span className="font-black text-[12px] uppercase tracking-widest truncate group-data-[collapsible=icon]:hidden">
                            {t(item.title)}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="bg-transparent p-4 h-12 flex items-center justify-center">
      </SidebarFooter>
    </Sidebar>
  );
}