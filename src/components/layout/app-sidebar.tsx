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
  Home,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AppSidebar() {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout, hasPermission } = useAuth();
  const { settings } = useAppContext();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();

  const side = language === 'ku' ? 'right' : 'left';
  const isCollapsed = state === 'collapsed';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navigation = [
    { title: 'Dashboard', icon: Home, href: '/', permission: 'admin:all' },
    { title: 'ashley_employees_management', icon: CreditCard, href: '/ashley-expenses', permission: 'page:ashley-expenses:view' },
    { title: 'transmit_cargo', icon: PackagePlus, href: '/transmit', permission: 'page:transmit:view' },
    { title: 'placement_storage', icon: Box, href: '/items', permission: 'page:items:view' },
    { title: 'marketing_feedback', icon: Star, href: '/marketing-feedback', permission: 'page:marketing-feedback:view' },
    { title: 'employees', icon: Users, href: '/employees', permission: 'page:employees:view' },
    { title: 'my_account', icon: UserCircle, href: '/account', permission: 'page:account' },
    { title: 'settings', icon: Settings, href: '/settings', permission: 'page:settings' },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar 
        side={side} 
        collapsible="icon" 
        className="border-none bg-sidebar print:hidden"
      >
        {/* Header */}
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            {settings.appLogo && (
              <div className="relative w-9 h-9 shrink-0 bg-white rounded-xl overflow-hidden shadow-sm">
                <Image
                  src={settings.appLogo}
                  alt="Logo"
                  fill
                  className="object-contain p-1.5"
                  unoptimized
                />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-sidebar-foreground truncate">
                  Ashley Staff
                </span>
                <span className="text-xs text-sidebar-foreground/50">
                  Management
                </span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* User Profile */}
        <div className={cn("p-3", isCollapsed && "px-2")}>
          <div className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl bg-sidebar-accent transition-colors",
            isCollapsed && "justify-center p-2"
          )}>
            <Avatar className="w-8 h-8 shrink-0 ring-2 ring-sidebar-foreground/10">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-sidebar-foreground/50">
                  Active
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarContent className="px-3">
          <SidebarMenu className="space-y-1">
            {navigation
              .filter((item) => hasPermission(item.permission))
              .map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "h-10 rounded-xl transition-all duration-200",
                            "hover:bg-sidebar-accent",
                            isActive && "bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground",
                            isCollapsed && "justify-center px-0"
                          )}
                        >
                          <Link href={item.href} className="flex items-center gap-3 px-3">
                            <item.icon className={cn(
                              "w-4 h-4 shrink-0",
                              isActive ? "text-sidebar" : "text-sidebar-foreground/70"
                            )} />
                            {!isCollapsed && (
                              <span className={cn(
                                "text-sm truncate",
                                isActive ? "font-medium" : "text-sidebar-foreground/90"
                              )}>
                                {t(item.title)}
                              </span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side={language === 'ku' ? 'left' : 'right'} className="font-medium">
                          {t(item.title)}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarContent>

        {/* Footer Actions */}
        <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto">
          <div className={cn(
            "flex items-center gap-1.5",
            isCollapsed ? "flex-col" : "justify-between"
          )}>
            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
                >
                  <span className="text-xs font-semibold">{language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[100px]">
                <DropdownMenuItem onClick={() => setLanguage('en')} className="text-sm">
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('ku')} className="text-sm">
                  Kurdish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="h-9 w-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>

            {/* Collapse Toggle */}
            <SidebarTrigger className="h-9 w-9 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground" />

            {/* Logout */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
