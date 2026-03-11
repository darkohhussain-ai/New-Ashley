'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/app-provider';
import type { User } from '@/lib/types';
import { initialData } from '@/context/initial-data';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users, roles, isLoading: appLoading } = useAppContext();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch {
        sessionStorage.removeItem('currentUser');
      }
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      // ADMINISTRATIVE BYPASS: 
      // If the email matches your specific identity, grant full admin access immediately.
      const username = currentUser.username.toLowerCase();
      const isAdminEmail = 
        username === 'darko.h.hussain@gmail.com' || 
        username === 'darko.h.husssain@gmail.com' || 
        username === 'darko_admin07';

      if (isAdminEmail || currentUser.roleId === 'role-admin') {
        setUserPermissions(new Set(['admin:all']));
        return;
      }

      if (roles && roles.length > 0) {
        const userRole = roles.find(role => role.id === currentUser.roleId);
        if (userRole) {
          setUserPermissions(new Set(userRole.permissions));
        } else {
          setUserPermissions(new Set());
        }
      }
    } else {
      setUserPermissions(new Set());
    }
  }, [currentUser, roles]);

  const loading = appLoading || authLoading;

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const allPossibleUsers = [
        ...(users || []),
        ...initialData.users.filter(initialUser => !(users || []).some(u => u.id === initialUser.id))
    ];
    
    const foundUser = allPossibleUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      sessionStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }

    return false;
  }, [users]);

  const logout = useCallback(async (): Promise<void> => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  }, []);
  
  const hasPermission = useCallback((permission: string): boolean => {
      if (userPermissions.has('admin:all')) return true;
      return userPermissions.has(permission);
  }, [userPermissions]);

  const value: AuthState = {
    user: currentUser,
    loading,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
