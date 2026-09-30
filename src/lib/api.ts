import {
  ApiResponse,
  ChartDataPoint,
  MonthlyReport,
  Product,
  StockOpname,
  Expense,
  Account,
  JournalEntry,
  Category,
  Customer,
  OutletSettings,
  Purchase,
  Transaction,
} from '@/types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pos-backend.fdsevx.workers.dev/api';

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
    document.cookie = `pos_admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
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

    // Auto-logout & redirect if token is invalid or unauthorized
    const isUnauthorized =
      response.status === 401 ||
      errorData?.error?.code === 'UNAUTHORIZED' ||
      errorData?.code === 'UNAUTHORIZED' ||
      (typeof errorData?.message === 'string' && errorData.message.toLowerCase().includes('invalid token')) ||
      (typeof errorData?.error?.message === 'string' && errorData.error.message.toLowerCase().includes('invalid token'));

    if (isUnauthorized) {
      removeAuthToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    throw new Error(errorData.message || errorData.error?.message || errorData.error || `HTTP error ${response.status}`);
  }

  const result: any = await response.json();
  if (result && typeof result === "object" && "data" in result) {
    return result.data;
  }
  return result;
}

// ----------------- Auth API -----------------
export async function loginAdmin(username: string = 'admin', password: string = 'admin123') {
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (data.tokens?.access_token) {
    setAuthToken(data.tokens.access_token);
  }
  return data;
}

export async function getOutletsList() {
  return apiFetch<any[]>('/v1/outlets');
}

// ----------------- Reports & Dashboard API -----------------
export async function getMonthlyReport(outletSlug: string, month: number = 9, year: number = 2026): Promise<MonthlyReport> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const endpoint = outletSlug === 'ALL' 
    ? `/v1/all/reports/monthly?month=${monthStr}` 
    : `/v1/${outletSlug}/reports/monthly?month=${monthStr}`;
  
  return apiFetch<MonthlyReport>(endpoint);
}

export async function getChartData(outletSlug: string, period: 'daily' | 'monthly' = 'daily', month: number = 9, year: number = 2026): Promise<ChartDataPoint[]> {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  // Backend allReportRouter currently doesn't have /chart, so we return empty if ALL
  if (outletSlug === 'ALL') return [];
  
  return apiFetch<ChartDataPoint[]>(`/v1/${outletSlug}/reports/chart?month=${monthStr}`);
}

export function getExportUrl(format: 'pdf' | 'excel', month: number = 9, year: number = 2026, outletSlug: string = 'ALL'): string {
  return `${API_BASE_URL}/v1/${outletSlug}/reports/export?format=${format}&month=${month}&year=${year}`;
}

// ----------------- Products / Inventory API -----------------
export async function getProducts(outletSlug: string, category?: string): Promise<Product[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);

  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiFetch<any[]>(`/v1/${outletSlug}/products${query}`);
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    ...item,
    stock_quantity: item.stock_quantity ?? item.stock ?? 0,
    cogs: String(item.cogs ?? item.cost_price ?? '0'),
    price: String(item.price ?? '0'),
    min_stock: item.min_stock ?? 5,
    unit: item.unit || 'pcs',
    is_active: item.is_active ?? item.is_available ?? true,
    outlet_type: item.outlet_name || item.outlet_type || 'Restoran',
    outlet_name: item.outlet_name || (item.outlet_type === 'CAFE' ? 'Cafe' : 'Restoran'),
    category: item.category_name || item.category || (item.categories?.name || 'Makanan'),
  }));
}

export async function createProduct(outletSlug: string, payload: Partial<Product> & any): Promise<Product> {
  const body = {
    name: payload.name,
    sku: payload.sku || `PRD-${Date.now().toString(36).toUpperCase()}`,
    unit: payload.unit || 'pcs',
    price: String(payload.price ?? '0'),
    cost_price: String(payload.cost_price ?? payload.cogs ?? '0'),
    stock: Number(payload.stock ?? payload.stock_quantity ?? 0),
    track_stock: payload.track_stock ?? true,
    is_available: payload.is_available ?? payload.is_active ?? true,
    category_id: payload.category_id || null,
    outlet_id: payload.outlet_id || null,
    description: payload.description || null,
  };

  return apiFetch<Product>(`/v1/${outletSlug}/products`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProduct(outletSlug: string, id: string, payload: Partial<Product> & any): Promise<Product> {
  const body: any = { ...payload };
  if (payload.price !== undefined) body.price = String(payload.price);
  if (payload.cogs !== undefined || payload.cost_price !== undefined) {
    body.cost_price = String(payload.cost_price ?? payload.cogs);
  }
  if (payload.stock_quantity !== undefined || payload.stock !== undefined) {
    body.stock = Number(payload.stock ?? payload.stock_quantity);
  }
  if (payload.is_active !== undefined) {
    body.is_available = payload.is_active;
  }

  return apiFetch<Product>(`/v1/${outletSlug}/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(outletSlug: string, id: string): Promise<void> {
  return apiFetch<void>(`/v1/${outletSlug}/products/${id}`, {
    method: 'DELETE',
  });
}

// ----------------- Stock Opname API -----------------
export async function createStockOpname(outletSlug: string, payload: { product_id: string; actual_stock: number; notes: string }): Promise<StockOpname> {
  return apiFetch<StockOpname>(`/v1/${outletSlug}/opname`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStockOpnames(outletSlug: string): Promise<{ items: StockOpname[]; total: number }> {
  return apiFetch<{ items: StockOpname[]; total: number }>(`/v1/${outletSlug}/opname`);
}

// ----------------- Outlets & Settings API -----------------
export async function getOutletSettings(outletSlug: string): Promise<OutletSettings> {
  return apiFetch<OutletSettings>(`/v1/${outletSlug}/settings`);
}

export async function updateOutletSettings(outletSlug: string, payload: Partial<OutletSettings>): Promise<OutletSettings> {
  return apiFetch<OutletSettings>(`/v1/${outletSlug}/settings`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ----------------- Categories API -----------------
export async function getCategories(outletSlug: string): Promise<Category[]> {
  return apiFetch<Category[]>(`/v1/${outletSlug}/categories`);
}

export async function createCategory(outletSlug: string, payload: { name: string; sort_order?: number; outlet_id?: string }): Promise<Category> {
  return apiFetch<Category>(`/v1/${outletSlug}/categories`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategory(outletSlug: string, id: string, payload: { name?: string; sort_order?: number }): Promise<Category> {
  return apiFetch<Category>(`/v1/${outletSlug}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategory(outletSlug: string, id: string): Promise<void> {
  return apiFetch<void>(`/v1/${outletSlug}/categories/${id}`, {
    method: 'DELETE',
  });
}

// ----------------- CRM & Pelanggan API -----------------
export async function getCustomers(outletSlug: string): Promise<Customer[]> {
  if (outletSlug === 'ALL') return [];
  return apiFetch<Customer[]>(`/v1/${outletSlug}/customers`);
}

export async function createCustomer(outletSlug: string, payload: { name: string; phone?: string; member_type?: 'regular' | 'vip' }): Promise<Customer> {
  return apiFetch<Customer>(`/v1/${outletSlug}/customers`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(outletSlug: string, id: string, payload: Partial<Customer>): Promise<Customer> {
  return apiFetch<Customer>(`/v1/${outletSlug}/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomer(outletSlug: string, id: string): Promise<void> {
  return apiFetch<void>(`/v1/${outletSlug}/customers/${id}`, {
    method: 'DELETE',
  });
}

export async function getCustomerHistory(outletSlug: string, id: string): Promise<Transaction[]> {
  return apiFetch<Transaction[]>(`/v1/${outletSlug}/customers/${id}/history`);
}

// ----------------- Transaksi Kasir & Void API -----------------
export async function createTransactionSale(outletSlug: string, payload: any): Promise<any> {
  return apiFetch<any>(`/v1/${outletSlug}/transactions`, {
    method: 'POST',
    headers: {
      'x-device-id': payload.device_id || 'admin-browser-pos',
    },
    body: JSON.stringify(payload),
  });
}

export async function voidTransaction(outletSlug: string, id: string, reason: string): Promise<any> {
  return apiFetch<any>(`/v1/${outletSlug}/transactions/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function getTransactionsList(outletSlug: string, from?: string, to?: string): Promise<Transaction[]> {
  if (outletSlug === 'ALL') return [];
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiFetch<Transaction[]>(`/v1/${outletSlug}/reports/export?${params.toString()}`);
}

// ----------------- Pembelian (Purchase) & Pengeluaran (Expense) API -----------------
export async function getExpenses(outletSlug: string): Promise<Expense[]> {
  if (outletSlug === 'ALL') return [];
  return apiFetch<Expense[]>(`/v1/${outletSlug}/expenses`);
}

export async function createExpense(outletSlug: string, payload: { category: string; description: string; amount: string; expense_date: string }): Promise<Expense> {
  return apiFetch<Expense>(`/v1/${outletSlug}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPurchases(outletSlug: string): Promise<Purchase[]> {
  if (outletSlug === 'ALL') return [];
  return apiFetch<Purchase[]>(`/v1/${outletSlug}/purchases`);
}

export async function createPurchase(outletSlug: string, payload: any): Promise<Purchase> {
  return apiFetch<Purchase>(`/v1/${outletSlug}/purchases`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ----------------- Accounting & Double Entry API -----------------
export async function getCOA(outletSlug: string): Promise<Account[]> {
  if (outletSlug === 'ALL') return [];
  return apiFetch<Account[]>(`/v1/${outletSlug}/accounting/coa`);
}

export async function createCOA(outletSlug: string, payload: Partial<Account>): Promise<Account> {
  return apiFetch<Account>(`/v1/${outletSlug}/accounting/coa`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createManualJournal(outletSlug: string, payload: any): Promise<any> {
  return apiFetch<any>(`/v1/${outletSlug}/accounting/journals/manual`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getGeneralLedger(outletSlug: string, from?: string, to?: string): Promise<any> {
  if (outletSlug === 'ALL') return [];
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiFetch<any>(`/v1/${outletSlug}/accounting/reports/general-ledger?${params.toString()}`);
}

export async function getTrialBalance(outletSlug: string, from?: string, to?: string): Promise<any> {
  if (outletSlug === 'ALL') return [];
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiFetch<any>(`/v1/${outletSlug}/accounting/reports/trial-balance?${params.toString()}`);
}

export async function getIncomeStatement(outletSlug: string, from?: string, to?: string): Promise<any> {
  if (outletSlug === 'ALL') return null;
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiFetch<any>(`/v1/${outletSlug}/accounting/reports/income-statement?${params.toString()}`);
}

export async function getBalanceSheet(outletSlug: string, to?: string): Promise<any> {
  if (outletSlug === 'ALL') return null;
  const params = new URLSearchParams();
  if (to) params.append('to', to);
  return apiFetch<any>(`/v1/${outletSlug}/accounting/reports/balance-sheet?${params.toString()}`);
}

// ----------------- Manajemen Pegawai (Users) API -----------------
export async function getUsers(): Promise<any[]> {
  return apiFetch<any[]>('/v1/users');
}

export async function createUser(payload: { username: string; password: string; display_name: string; role: string; outlet_ids?: string[] }): Promise<any> {
  return apiFetch<any>('/v1/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: string, payload: any): Promise<any> {
  return apiFetch<any>(`/v1/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function resetUserPassword(id: string, new_password: string): Promise<any> {
  return apiFetch<any>(`/v1/users/${id}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ new_password }),
  });
}

export async function deleteUser(id: string): Promise<void> {
  return apiFetch<void>(`/v1/users/${id}`, {
    method: 'DELETE',
  });
}

export async function getAccounts(outletSlug: string): Promise<Account[]> {
  return getCOA(outletSlug);
}

export async function getJournals(outletSlug: string): Promise<{ items: JournalEntry[]; total: number }> {
  const gl = await getGeneralLedger(outletSlug);
  return { items: gl || [], total: gl?.length || 0 };
}

export function removeAuthToken() {
  authToken = '';
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pos_admin_token');
    document.cookie = 'pos_admin_token=; path=/; max-age=0; SameSite=Lax';
  }
}

export async function getUserProfile() {
  return apiFetch<any>('/v1/auth/me');
}

// ----------------- Dashboard & Laporan API -----------------
export async function getDashboardSummary(outletSlug: string, startDate?: string, endDate?: string): Promise<any> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  if (outletSlug === 'ALL') {
    return apiFetch<any>(`/v1/reports/summary?${params.toString()}`);
  }
  return apiFetch<any>(`/v1/${outletSlug}/reports/summary?${params.toString()}`);
}

export async function getDashboardChart(outletSlug: string, startDate?: string, endDate?: string): Promise<any> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  if (outletSlug === 'ALL') {
    return apiFetch<any>(`/v1/reports/chart?${params.toString()}`);
  }
  return apiFetch<any>(`/v1/${outletSlug}/reports/chart?${params.toString()}`);
}
