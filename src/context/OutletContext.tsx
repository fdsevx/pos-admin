'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OutletFilter } from '@/types';
import { getAuthToken, getOutletsList, getUserProfile } from '@/lib/api';
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
  userProfile: any | null;
  refreshOutlets: () => Promise<void>;
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
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const refreshOutlets = async () => {
    try {
      const data = await getOutletsList();
      setOutlets(data || []);
    } catch (err) {
      console.error("Failed to refresh outlets", err);
    }
  };

  useEffect(() => {
    if (getAuthToken()) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getUserProfile().then(res => {
        // Backend returns { user: {...} } so it might be unwrapped by apiFetch
        setUserProfile(res?.user || res);
      }).catch(() => {});

      refreshOutlets();
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
        userProfile,
        refreshOutlets,
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
