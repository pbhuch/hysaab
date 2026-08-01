import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, LaundryEntry } from '../../domain/types';
import { StorageService, STORAGE_KEYS } from '../../application/StorageService';
import { mockVendors, mockLaundryEntries } from '../../data/mockData';

interface LaundryState {
  vendors: Vendor[];
  entries: LaundryEntry[];
}

const initialState: LaundryState = {
  vendors: mockVendors.filter(v => v.type === 'laundry'),
  entries: mockLaundryEntries,
};

const laundrySlice = createSlice({
  name: 'laundry',
  initialState,
  reducers: {
    setLaundryState: (state, action: PayloadAction<LaundryState>) => {
      state.vendors = action.payload.vendors;
      state.entries = action.payload.entries;
    },
    addVendor: (state, action: PayloadAction<Vendor>) => {
      state.vendors.push(action.payload);
      StorageService.save(STORAGE_KEYS.VENDORS, state.vendors);
    },
    updateVendor: (state, action: PayloadAction<Vendor>) => {
      const idx = state.vendors.findIndex(v => v.id === action.payload.id);
      if (idx !== -1) {
        state.vendors[idx] = action.payload;
        StorageService.save(STORAGE_KEYS.VENDORS, state.vendors);
      }
    },
    addLaundryEntry: (state, action: PayloadAction<LaundryEntry>) => {
      state.entries.unshift(action.payload);
      StorageService.save(STORAGE_KEYS.LAUNDRY_ENTRIES, state.entries);
    },
    updateLaundryEntry: (state, action: PayloadAction<LaundryEntry>) => {
      const idx = state.entries.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        state.entries[idx] = action.payload;
        StorageService.save(STORAGE_KEYS.LAUNDRY_ENTRIES, state.entries);
      }
    },
    deleteLaundryEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(e => e.id !== action.payload);
      StorageService.save(STORAGE_KEYS.LAUNDRY_ENTRIES, state.entries);
    },
  },
});

export const { setLaundryState, addVendor, updateVendor, addLaundryEntry, updateLaundryEntry, deleteLaundryEntry } = laundrySlice.actions;
export default laundrySlice.reducer;
