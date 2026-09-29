const fs = require('fs');
let code = `import { ApiResponse, ChartDataPoint, MonthlyReport, Product, StockOpname, Expense, Account, JournalEntry } from '@/types';

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
    ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
    ...options.headers,
  };

  const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error?.message || errorData.error || \`HTTP error \${response.status}\`);
  }

  const result: any = await response.json();
  if (result && typeof result === "object" && "data" in result) {
    return result.data;
  }
  return result;
}

// ----------------- Auth API -----------------
export async function loginAdmin(username: string = 'admin', password: string = 'admin123') {
  const response = await fetch(\`\${API_BASE_URL}/v1/auth/login\`, {
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
  const monthStr = \`\${year}-\${String(month).padStart(2, '0')}\`;
  const endpoint = outletSlug === 'ALL' 
    ? \`/v1/all/reports/monthly?month=\${monthStr}\` 
    : \`/v1/\${outletSlug}/reports/monthly?month=\${monthStr}\`;
  
  return apiFetch<MonthlyReport>(endpoint);
}

export async function getChartData(outletSlug: string, period: 'daily' | 'monthly' = 'daily', month: number = 9, year: number = 2026): Promise<ChartDataPoint[]> {
  const monthStr = \`\${year}-\${String(month).padStart(2, '0')}\`;
  
  // Backend allReportRouter currently doesn't have /chart, so we return empty if ALL
  if (outletSlug === 'ALL') return [];
  
  return apiFetch<ChartDataPoint[]>(\`/v1/\${outletSlug}/reports/chart?month=\${monthStr}\`);
}

export function getExportUrl(format: 'pdf' | 'excel', month: number = 9, year: number = 2026, outletSlug: string = 'ALL'): string {
  return \`\${API_BASE_URL}/v1/\${outletSlug}/reports/export?format=\${format}&month=\${month}&year=\${year}\`;
}

// ----------------- Products / Inventory API -----------------
export async function getProducts(outletSlug: string, category?: string): Promise<Product[]> {
  if (outletSlug === 'ALL') return []; // Need specific outlet for products based on current backend routes
  const params = new URLSearchParams();
  if (category) params.append('category', category);

  const query = params.toString() ? \`?\${params.toString()}\` : '';
  return apiFetch<Product[]>(\`/v1/\${outletSlug}/products\${query}\`);
}

export async function createProduct(outletSlug: string, payload: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(\`/v1/\${outletSlug}/products\`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(outletSlug: string, id: string, payload: Partial<Product>): Promise<Product> {
  return apiFetch<Product>(\`/v1/\${outletSlug}/products/\${id}\`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(outletSlug: string, id: string): Promise<void> {
  return apiFetch<void>(\`/v1/\${outletSlug}/products/\${id}\`, {
    method: 'DELETE',
  });
}

// ----------------- Stock Opname API -----------------
export async function createStockOpname(outletSlug: string, payload: { product_id: string; actual_stock: number; notes: string }): Promise<StockOpname> {
  return apiFetch<StockOpname>(\`/v1/\${outletSlug}/opname\`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getStockOpnames(outletSlug: string): Promise<{ items: StockOpname[]; total: number }> {
  if (outletSlug === 'ALL') return { items: [], total: 0 };
  return apiFetch<{ items: StockOpname[]; total: number }>(\`/v1/\${outletSlug}/opname\`);
}

// ----------------- Accounting & Double Entry API -----------------
export async function getAccounts(outletSlug: string): Promise<Account[]> {
  if (outletSlug === 'ALL') return [];
  return apiFetch<Account[]>(\`/v1/\${outletSlug}/accounting/ledger\`); // Dummy for now, actual backend has ledger, etc.
}

export async function getJournals(outletSlug: string): Promise<{ items: JournalEntry[]; total: number }> {
  if (outletSlug === 'ALL') return { items: [], total: 0 };
  return apiFetch<{ items: JournalEntry[]; total: number }>(\`/v1/\${outletSlug}/accounting/ledger\`);
}

export function removeAuthToken() {
  authToken = '';
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pos_admin_token');
  }
}
`;
fs.writeFileSync('src/lib/api.ts', code);
