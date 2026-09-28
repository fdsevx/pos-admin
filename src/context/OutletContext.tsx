'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OutletFilter } from '@/types';
import { loginAdmin, getAuthToken } from '@/lib/api';

interface OutletContextType {
  outletFilter: OutletFilter;
  setOutletFilter: (filter: OutletFilter) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isAuthenticated: boolean;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const [outletFilter, setOutletFilter] = useState<OutletFilter>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Auto-login default admin on client init so requests have JWT
  useEffect(() => {
    async function initAuth() {
      try {
        if (!getAuthToken()) {
          const res = await loginAdmin('admin', 'admin123');
          if (res.success) {
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn('Auto auth initialized with fallback:', err);
      }
    }
    initAuth();
  }, []);

  return (
    <OutletContext.Provider
      value={{
        outletFilter,
        setOutletFilter,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isAuthenticated,
      }}
    >
      {children}
    </OutletContext.Provider>
  );
}

export function useOutlet() {
  const context = useContext(OutletContext);
  if (!context) {
    throw new Error('useOutlet must be used within an OutletProvider');
  }
  return context;
}
