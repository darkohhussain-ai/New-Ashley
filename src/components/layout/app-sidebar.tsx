
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
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
  Sun,
  Moon,
  LogOut,
  ShieldAlert,
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

function DateTimeDisplay() {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-6 animate-pulse bg-muted/20 rounded w-full" />;

  return (
    <div className="flex flex-col items-center gap-0.5 opacity-80 text-white">
      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] opacity-60">
        <Calendar className="w-2.5 h-2.5" />
        <span>{format(time, 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] font-black tracking-widest">
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navigation = [
    {
      items: [
        { title: 'Dashboard', icon: Home, href: '/', permission: 'admin:all' },
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
    <Sidebar side={side} collapsible="icon" className="border-none shadow-2xl bg-sidebar/68 backdrop-blur-2xl print:hidden overflow-hidden">
      <SidebarHeader className="p-4 bg-transparent border-b border-white/10">
        <div className="flex items-center justify-between mb-4 px-1">
            <SidebarTrigger className="text-white hover:bg-white/10 transition-all h-8 w-8" />
            {state === "expanded" && (
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Node Online</span>
                </div>
            )}
        </div>
        
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-700">
            {settings.appLogo && (
                <div className={cn(
                    "relative flex items-center justify-center transition-all duration-500",
                    "w-full px-2 group-data-[collapsible=icon]:px-0"
                )}>
                    <div className="relative w-10 h-10 bg-white rounded-xl p-1.5 shadow-2xl ring-2 ring-white/20 overflow-hidden">
                        <Image
                            src={settings.appLogo}
                            alt="Logo"
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                    {state === "expanded" && (
                        <div className="ml-3 flex flex-col items-start overflow-hidden">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">ASHLEY STAFF</span>
                            <span className="text-[7px] font-bold uppercase text-white/40">Terminal Node</span>
                        </div>
                    )}
                </div>
            )}
            {state === "expanded" && (
                <div className="animate-in fade-in duration-500 mt-1">
                    <DateTimeDisplay />
                </div>
            )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent scrollbar-none">
        <div className="px-3 py-4 group-data-[collapsible=icon]:px-1">
            <div className="bg-white/10 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5 shadow-inner group/user cursor-default group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
                <Avatar className="w-8 h-8 border-2 border-white/20 ring-2 ring-white/10 group-hover/user:ring-white/30 transition-all group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7">
                    <AvatarFallback className="bg-white text-primary font-black text-[9px]">
                        {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                    <p className="text-[10px] font-black uppercase tracking-wider truncate leading-tight text-white">{user?.username}</p>
                    <p className="text-[7px] font-bold text-white/40 uppercase tracking-tighter">Encrypted Session</p>
                </div>
            </div>
        </div>

        <div className="px-3 mb-6 grid grid-cols-3 gap-1.5 group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:px-1.5">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all">
                        <span className="text-[9px] font-black uppercase tracking-widest">{language === 'ku' ? 'KU' : 'EN'}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-popover border-border text-popover-foreground">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="text-[10px] font-black uppercase">English</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('ku')} className="text-[10px] font-black uppercase">کوردی</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                variant="ghost" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-9 w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl flex flex-col items-center justify-center p-0 transition-all"
            >
                {theme === 'light' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            </Button>

            <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="h-9 w-full bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/20 rounded-xl flex flex-col items-center justify-center p-0 transition-all"
            >
                <LogOut className="w-3 h-3" />
            </Button>
        </div>

        <Separator className="bg-white/10 mb-4 mx-3 w-auto group-data-[collapsible=icon]:hidden" />

        {navigation.map((group, gIndex) => (
          <div key={gIndex} className="py-1">
              <SidebarMenu>
                {group.items
                  .filter((item) => hasPermission(item.permission))
                  .map((item) => (
                    <SidebarMenuItem key={item.href} className="px-2.5 mb-1 group-data-[collapsible=icon]:px-1">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                        tooltip={t(item.title)}
                        className={cn(
                            "rounded-xl transition-all duration-300 hover:bg-white/10 h-10 border border-transparent flex items-center justify-start group-data-[collapsible=icon]:justify-center",
                            "data-[active=true]:bg-white data-[active=true]:text-primary data-[active=true]:shadow-2xl data-[active=true]:border-white/20",
                            "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:h-10"
                        )}
                      >
                        <Link href={item.href} className="flex items-center gap-2.5 px-2.5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                          <item.icon className={cn(
                              "w-3.5 h-3.5 shrink-0 transition-transform duration-300",
                              pathname === item.href ? "scale-110" : "opacity-60 text-white"
                          )} />
                          <span 
                            className="font-black truncate group-data-[collapsible=icon]:hidden tracking-tight"
                            style={{ 
                                fontSize: 'var(--sidebar-custom-font-size)', 
                                textTransform: 'var(--sidebar-text-transform)' as any 
                            }}
                          >
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
      <SidebarFooter className="bg-transparent p-4 h-10 flex items-center justify-center border-t border-white/5">
         <span className="text-[7px] font-black uppercase tracking-[0.3em] text-white/30">System v2.5 Alpha</span>
      </SidebarFooter>
    </Sidebar>
  );
}
