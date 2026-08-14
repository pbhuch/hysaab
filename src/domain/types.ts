export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'family';
  pin_hash?: string;
  settings: {
    theme: 'light' | 'dark';
    currency: string; // e.g. "INR" (₹) or "USD" ($)
    pinEnabled: boolean;
    lastBackupDate?: string;
    notificationsEnabled: boolean;
    milkReminderTime: string; // "07:30"
  };
}

export type VendorType = 'milk' | 'laundry';
export type DeliverySchedule = 'daily' | 'alternate' | 'custom';

export interface Vendor {
  id: string;
  type: VendorType;
  name: string;
  phone: string;
  base_rate: number;
  schedule: DeliverySchedule;
  active: boolean;
}

export interface MilkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  vendor_id: string;
  quantity_ltr: number;
  rate_per_ltr: number;
  total: number;
  payment_mode: 'cash' | 'upi';
  note?: string;
  photo_uri?: string;
}

export interface LaundryEntry {
  id: string;
  date_sent: string; // YYYY-MM-DD
  date_received?: string; // YYYY-MM-DD
  vendor_id: string;
  items: {
    shirts: number;
    pants: number;
    bedsheets: number;
    towels: number;
    others: number;
  };
  rate_map: {
    shirts: number;
    pants: number;
    bedsheets: number;
    towels: number;
    others: number;
  };
  total: number;
  note?: string;
  receipt_uri?: string;
  status: 'sent' | 'received';
}

export type MaidRole = 'cook' | 'cleaning' | 'nanny' | 'driver';

export interface Maid {
  id: string;
  name: string;
  role: MaidRole;
  phone: string;
  monthly_rate: number;
  payment_cycle_start: number; // Day of month (e.g. 1st)
  active: boolean;
  joined_date: string; // YYYY-MM-DD
  exit_date?: string; // YYYY-MM-DD
}

export type AttendanceStatus = 'present' | 'absent_paid' | 'absent_unpaid' | 'half_day';

export interface MaidAttendance {
  id: string;
  maid_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note?: string;
}

export interface Payment {
  id: string;
  module: 'milk' | 'laundry' | 'maid';
  ref_id: string; // vendor_id or maid_id
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  amount: number;
  paid_on: string; // YYYY-MM-DD
  mode: 'cash' | 'upi';
  note?: string;
}

export interface RateChange {
  id: string;
  vendor_id: string;
  effective_from: string; // YYYY-MM-DD
  rate_per_ltr: number;
}

export interface Advance {
  id: string;
  module: 'milk' | 'laundry' | 'maid';
  ref_id: string; // vendor_id or maid_id
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

