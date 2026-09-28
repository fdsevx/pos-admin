import { ApiResponse, ChartDataPoint, MonthlyReport, Product, StockOpname, Expense, Account, JournalEntry } from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://posbackend-jbe49fya.b4a.run';

// Helper for formatted currency
export function formatRupiah(value: number | string | undefined): string {
  if (value === undefined || value === null) return 'Rp0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Global cached token (can be stored in localStorage or cookie in real app)
let authToken = '';

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos_admin_token', token);
  }
}

export function getAuthToken(): string {
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('pos_admin_token') || '';
  }
  return authToken;
}

// Generic fetcher
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error ${response.status}`);
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

// ----------------- Auth API -----------------
export async function loginAdmin(username: string = 'admin', password: string = 'admin123') {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (data.success && data.data?.token) {
    setAuthToken(data.data.token);
  }
  return data;
}

// ----------------- Reports & Dashboard API -----------------
export async function getMonthlyReport(outletType?: string, month: number = 9, year: number = 2026): Promise<MonthlyReport> {
  const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
  const headers: HeadersInit = {};
  if (outletType && outletType !== 'ALL') {
    headers['X-Outlet-Type'] = outletType;
  }
  return apiFetch<MonthlyReport>(`/api/v1/reports/monthly?${params.toString()}`, { headers });
}

export async function getChartData(outletType?: string, period: 'daily' | 'monthly' = 'daily', month: number = 9, year: number = 2026): Promise<ChartDataPoint[]> {
  const params = new URLSearchParams({ period, month: month.toString(), year: year.toString() });
  const headers: HeadersInit = {};
  if (outletType && outletType !== 'ALL') {
    headers['X-Outlet-Type'] = outletType;
  }
  return apiFetch<ChartDataPoint[]>(`/api/v1/reports/chart?${params.toString()}`, { headers });
}

export function getExportUrl(format: 'pdf' | 'excel', month: number = 9, year: number = 2026, outletType: string = 'ALL'): string {
  return `${API_BASE_URL}/api/v1/reports/export?format=${format}&month=${month}&year=${year}&outlet_type=${outletType}`;
}

// ----------------- Products / Inventory API -----------------
export async function getProducts(outletType?: string, category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (outletType && outletType !== 'ALL') params.append('outlet_type', outletType);
  if (category) params.append('category', category);

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<Product[]>(`/api/v1/products${query}`);
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  return apiFetch<Product>('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(`/api/v1/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/products/${id}`, {
    method: 'DELETE',
  });
}

// ----------------- Stock Opname API -----------------
export async function createStockOpname(payload: { product_id: string; actual_stock: number; notes: string }): Promise<StockOpname> {
  return apiFetch<StockOpname>('/api/v1/opname', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStockOpnames(outletType?: string): Promise<{ items: StockOpname[]; total: number }> {
  const params = new URLSearchParams();
  if (outletType && outletType !== 'ALL') params.append('outlet_type', outletType);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<{ items: StockOpname[]; total: number }>(`/api/v1/opname${query}`);
}

// ----------------- Accounting & Double Entry API -----------------
export async function getAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>('/api/v1/accounts');
}

export async function getJournals(outletType?: string): Promise<{ items: JournalEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (outletType && outletType !== 'ALL') params.append('outlet_type', outletType);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<{ items: JournalEntry[]; total: number }>(`/api/v1/journals${query}`);
}
