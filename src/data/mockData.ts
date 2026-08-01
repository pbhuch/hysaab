import { Vendor, MilkEntry, LaundryEntry, Maid, MaidAttendance, Payment, RateChange } from '../domain/types';

export const mockVendors: Vendor[] = [
  {
    id: 'v_milk_1',
    type: 'milk',
    name: 'Krishna Dairy',
    phone: '9876543210',
    base_rate: 64,
    schedule: 'daily',
    active: true,
  },
  {
    id: 'v_milk_2',
    type: 'milk',
    name: 'Mother Dairy Booth',
    phone: '9812345678',
    base_rate: 68,
    schedule: 'alternate',
    active: true,
  },
  {
    id: 'v_laundry_1',
    type: 'laundry',
    name: 'Dhobi Ramu',
    phone: '9765432109',
    base_rate: 10,
    schedule: 'custom',
    active: true,
  },
  {
    id: 'v_laundry_2',
    type: 'laundry',
    name: 'Spin & Glow Drycleaners',
    phone: '9988776655',
    base_rate: 15,
    schedule: 'custom',
    active: true,
  }
];

export const mockRateChanges: RateChange[] = [
  {
    id: 'rc_1',
    vendor_id: 'v_milk_1',
    effective_from: '2026-07-15',
    rate_per_ltr: 66,
  }
];

export const mockMilkEntries: MilkEntry[] = [
  // Krishna Dairy deliveries in July (before and after rate change)
  {
    id: 'me_1',
    date: '2026-07-01',
    vendor_id: 'v_milk_1',
    quantity_ltr: 1.5,
    rate_per_ltr: 64,
    total: 96,
    payment_mode: 'upi',
  },
  {
    id: 'me_2',
    date: '2026-07-02',
    vendor_id: 'v_milk_1',
    quantity_ltr: 1.5,
    rate_per_ltr: 64,
    total: 96,
    payment_mode: 'upi',
  },
  {
    id: 'me_3',
    date: '2026-07-14',
    vendor_id: 'v_milk_1',
    quantity_ltr: 1.5,
    rate_per_ltr: 64,
    total: 96,
    payment_mode: 'upi',
  },
  {
    id: 'me_4',
    date: '2026-07-15', // Rate changed to 66
    vendor_id: 'v_milk_1',
    quantity_ltr: 2,
    rate_per_ltr: 66,
    total: 132,
    payment_mode: 'cash',
  },
  {
    id: 'me_5',
    date: '2026-07-27',
    vendor_id: 'v_milk_1',
    quantity_ltr: 1.5,
    rate_per_ltr: 66,
    total: 99,
    payment_mode: 'upi',
  },
  {
    id: 'me_6',
    date: '2026-07-28',
    vendor_id: 'v_milk_1',
    quantity_ltr: 1.5,
    rate_per_ltr: 66,
    total: 99,
    payment_mode: 'upi',
  }
];

export const mockLaundryEntries: LaundryEntry[] = [
  {
    id: 'le_1',
    date_sent: '2026-07-05',
    date_received: '2026-07-08',
    vendor_id: 'v_laundry_1',
    items: {
      shirts: 5,
      pants: 4,
      bedsheets: 2,
      towels: 1,
      others: 0,
    },
    rate_map: {
      shirts: 10,
      pants: 10,
      bedsheets: 30,
      towels: 15,
      others: 0,
    },
    total: 165, // (5*10)+(4*10)+(2*30)+(1*15) = 50 + 40 + 60 + 15 = 165
    status: 'received',
  },
  {
    id: 'le_2',
    date_sent: '2026-07-20',
    vendor_id: 'v_laundry_1',
    items: {
      shirts: 8,
      pants: 6,
      bedsheets: 0,
      towels: 2,
      others: 1,
    },
    rate_map: {
      shirts: 10,
      pants: 10,
      bedsheets: 30,
      towels: 15,
      others: 10,
    },
    total: 180, // (8*10)+(6*10)+(0*30)+(2*15)+(1*10) = 80 + 60 + 30 + 10 = 180
    status: 'sent',
  }
];

export const mockMaids: Maid[] = [
  {
    id: 'm_1',
    name: 'Sharda Bai',
    role: 'cook',
    phone: '9822334455',
    monthly_rate: 6000,
    payment_cycle_start: 1,
    active: true,
    joined_date: '2026-01-01',
  },
  {
    id: 'm_2',
    name: 'Ramesh Singh',
    role: 'driver',
    phone: '9844556677',
    monthly_rate: 15000,
    payment_cycle_start: 1,
    active: true,
    joined_date: '2026-05-15', // Mid-month join
  }
];

export const mockMaidAttendance: MaidAttendance[] = [
  // Sharda Bai attendance in July 2026
  { id: 'att_1', maid_id: 'm_1', date: '2026-07-01', status: 'present' },
  { id: 'att_2', maid_id: 'm_1', date: '2026-07-02', status: 'present' },
  { id: 'att_3', maid_id: 'm_1', date: '2026-07-03', status: 'absent_paid' }, // Paid leave
  { id: 'att_4', maid_id: 'm_1', date: '2026-07-04', status: 'present' },
  { id: 'att_5', maid_id: 'm_1', date: '2026-07-05', status: 'half_day' },    // Half day (0.5 leave)
  { id: 'att_6', maid_id: 'm_1', date: '2026-07-06', status: 'absent_unpaid' }, // Unpaid leave (1.0 leave)
  
  // Ramesh Singh attendance in July 2026 (All present except one unpaid)
  { id: 'att_7', maid_id: 'm_2', date: '2026-07-01', status: 'present' },
  { id: 'att_8', maid_id: 'm_2', date: '2026-07-10', status: 'absent_unpaid' },
];

export const mockPayments: Payment[] = [
  {
    id: 'p_1',
    module: 'maid',
    ref_id: 'm_1',
    period_start: '2026-06-01',
    period_end: '2026-06-30',
    amount: 6000,
    paid_on: '2026-07-02',
    mode: 'upi',
    note: 'June salary settled',
  }
];
