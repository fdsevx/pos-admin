'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { OutletFilter, Location, BusinessUnit } from '@/types';
import { getAuthToken, getOutletsList, getLocationsList, getUserProfile } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface OutletContextType {
  outletFilter: OutletFilter;
  setOutletFilter: (filter: OutletFilter) => void;
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  outlets: any[];
  locations: Location[];
  filteredOutlets: any[];
  userProfile: any | null;
  refreshOutlets: () => Promise<void>;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [outletFilter, setOutletFilter] = useState<OutletFilter>('ALL');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const refreshOutlets = async () => {
    try {
      const [locData, outData] = await Promise.all([
        getLocationsList().catch(() => []),
        getOutletsList().catch(() => [])
      ]);
      setLocations(locData || []);
      setOutlets(outData || []);
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
        setUserProfile(res?.user || res);
      }).catch(() => {});
      refreshOutlets();
    }
  }, [isAuthenticated]);

  // Derived state: filtered outlets based on selected location
  const filteredOutlets = selectedLocationId === 'ALL' 
    ? outlets 
    : outlets.filter(o => o.location_id === selectedLocationId);

  // Auto-select unit logic if current outletFilter is not in filteredOutlets
  useEffect(() => {
    if (filteredOutlets.length > 0 && selectedLocationId !== 'ALL') {
      const isValid = filteredOutlets.some(o => o.slug === outletFilter);
      if (!isValid && outletFilter !== 'ALL') {
        setOutletFilter(filteredOutlets[0].slug);
      }
    }
  }, [selectedLocationId, filteredOutlets, outletFilter]);

  return (
    <OutletContext.Provider
      value={{
        outletFilter,
        setOutletFilter,
        selectedLocationId,
        setSelectedLocationId,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isAuthenticated,
        setIsAuthenticated,
        outlets,
        locations,
        filteredOutlets,
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
