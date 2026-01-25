
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/app-provider';
import type { User } from '@/lib/types';

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
    if (currentUser && roles && roles.length > 0) {
      const userRole = roles.find(role => role.id === currentUser.roleId);
      if (userRole) {
        const newPermissions = new Set(userRole.permissions);
        setUserPermissions(newPermissions);
      } else {
        setUserPermissions(new Set());
      }
    } else {
      setUserPermissions(new Set());
    }
  }, [currentUser, roles]);

  const loading = appLoading || authLoading;

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!users) {
        console.error("Login tried before users were loaded.");
        return false;
    }
    const foundUser = users.find(
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
