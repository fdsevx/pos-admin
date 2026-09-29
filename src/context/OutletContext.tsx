'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OutletFilter } from '@/types';
import { getAuthToken, getOutletsList } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
  setIsAuthenticated: (val: boolean) => void;
  outlets: any[];
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [outletFilter, setOutletFilter] = useState<OutletFilter>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<any[]>([]);

  useEffect(() => {
    if (getAuthToken()) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getOutletsList().then((data) => {
        setOutlets(data || []);
        if (data && data.length > 0 && outletFilter === 'ALL') {
          // You could set default outlet here if you want
        }
      }).catch(err => {
        console.error("Failed to fetch outlets", err);
      });
    }
  }, [isAuthenticated]);

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
        setIsAuthenticated,
        outlets,
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
