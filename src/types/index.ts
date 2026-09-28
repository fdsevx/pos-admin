export type OutletFilter = 'ALL' | 'RESTORAN' | 'CAFE';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string;
  cogs: string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  outlet_type: 'RESTORAN' | 'CAFE';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyReport {
  period: string;
  outlet_type: string;
  total_revenue: string;
  total_cogs: string;
  gross_profit: string;
  total_expenses: string;
  net_profit: string;
  transaction_count: number;
  average_transaction: string;
}

export interface ChartDataPoint {
  label: string;
  revenue: string;
  cogs: string;
  profit: string;
  transaction_count: number;
}

export interface StockOpname {
  id: string;
  product_id: string;
  product?: Product;
  system_stock: number;
  actual_stock: number;
  difference: number;
  notes: string;
  outlet_type: string;
  status: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: string;
  outlet_type: string;
  expense_date: string;
  created_at?: string;
}

export interface Account {
  code: string;
  name: string;
  type: string;
  normal_balance: string;
  is_active: boolean;
}

export interface JournalLine {
  id: string;
  journal_entry_id: string;
  account_code: string;
  account?: Account;
  debit: string;
  credit: string;
  description: string;
}

export interface JournalEntry {
  id: string;
  transaction_id?: string;
  reference_type: string;
  reference_id: string;
  description: string;
  entry_date: string;
  outlet_type: string;
  lines?: JournalLine[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
