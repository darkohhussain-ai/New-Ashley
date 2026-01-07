'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/app-provider';
import type { User, Role, Employee } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users, roles, employees } = useAppContext();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for a logged-in user in sessionStorage on initial load
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // We need to find the full employee record to get the latest password
        const empRecord = employees.find(e => e.name === parsedUser.username);
        if (empRecord) {
          const userForSession: User = { ...parsedUser, password: empRecord.password };
          setCurrentUser(userForSession);
        } else {
           setCurrentUser(parsedUser);
        }
      } catch {
        // if parsing fails, just clear it
        sessionStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, [employees]);

  useEffect(() => {
    // When currentUser or roles change, update permissions
    if (currentUser) {
      const userRole = roles.find(role => role.id === currentUser.roleId);
      if (userRole) {
        setUserPermissions(new Set(userRole.permissions));
      } else {
        setUserPermissions(new Set());
      }
    } else {
      setUserPermissions(new Set());
    }
  }, [currentUser, roles]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Find the employee record first
    const employeeRecord = employees.find(emp => emp.name.toLowerCase() === username.toLowerCase());
    if (!employeeRecord || employeeRecord.password !== password) {
        return false;
    }
    
    // Find the corresponding user record in the `users` list
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (foundUser) {
      // Create a user object for the session that includes the password for verification
      const userForSession: User = { ...foundUser, password: employeeRecord.password };
      setCurrentUser(userForSession);
      sessionStorage.setItem('currentUser', JSON.stringify(userForSession));
      return true;
    }

    return false;
  }, [users, employees]);

  const logout = useCallback(async (): Promise<void> => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
  }, []);
  
  const hasPermission = useCallback((permission: string): boolean => {
      // The admin:all permission grants access to everything
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
