export type OutletFilter = string;

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

export interface Category {
  id: string;
  name: string;
  sort_order?: number;
  outlet_id?: string;
  created_at?: string;
}

export interface OutletSettings {
  id: string;
  name: string;
  slug: string;
  tax_percent: string;
  service_percent: string;
  receipt_header: string;
  receipt_footer: string;
  is_active?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  member_type: 'regular' | 'vip';
  points?: number;
  total_spent?: string;
  outlet_id?: string;
  created_at?: string;
}

export interface Purchase {
  id: string;
  outlet_id: string;
  supplier_id?: string;
  invoice_number?: string;
  total_amount: string;
  purchased_at: string;
  notes?: string;
  created_by?: string;
}

export interface TransactionItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  cost_price_snapshot: string;
  subtotal: string;
  discount_amount?: string;
}

export interface PaymentItem {
  method: 'TUNAI' | 'QRIS';
  amount: string;
  amount_received?: string;
  change_amount?: string;
  qris_reference?: string;
}

export interface Transaction {
  id: string;
  receipt_number?: string;
  device_id: string;
  customer_id?: string;
  subtotal: string;
  discount_amount?: string;
  tax_amount?: string;
  service_amount?: string;
  grand_total: string;
  status: 'PAID' | 'VOID' | 'REFUNDED';
  notes?: string;
  created_at: string;
  items?: TransactionItem[];
  payments?: PaymentItem[];
}
