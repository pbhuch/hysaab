import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, MilkEntry, RateChange } from '../../domain/types';
import { StorageService, STORAGE_KEYS } from '../../application/StorageService';
import { mockVendors, mockMilkEntries, mockRateChanges } from '../../data/mockData';

interface MilkState {
  vendors: Vendor[];
  entries: MilkEntry[];
  rateChanges: RateChange[];
}

const initialState: MilkState = {
  vendors: mockVendors.filter(v => v.type === 'milk'),
  entries: mockMilkEntries,
  rateChanges: mockRateChanges,
};

const milkSlice = createSlice({
  name: 'milk',
  initialState,
  reducers: {
    setMilkState: (state, action: PayloadAction<MilkState>) => {
      state.vendors = action.payload.vendors;
      state.entries = action.payload.entries;
      state.rateChanges = action.payload.rateChanges;
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
    addMilkEntry: (state, action: PayloadAction<MilkEntry>) => {
      state.entries.unshift(action.payload);
      StorageService.save(STORAGE_KEYS.MILK_ENTRIES, state.entries);
    },
    updateMilkEntry: (state, action: PayloadAction<MilkEntry>) => {
      const idx = state.entries.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        state.entries[idx] = action.payload;
        StorageService.save(STORAGE_KEYS.MILK_ENTRIES, state.entries);
      }
    },
    deleteMilkEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(e => e.id !== action.payload);
      StorageService.save(STORAGE_KEYS.MILK_ENTRIES, state.entries);
    },
    addRateChange: (state, action: PayloadAction<RateChange>) => {
      state.rateChanges.push(action.payload);
      StorageService.save(STORAGE_KEYS.RATE_CHANGES, state.rateChanges);
    },
  },
});

export const { setMilkState, addVendor, updateVendor, addMilkEntry, updateMilkEntry, deleteMilkEntry, addRateChange } = milkSlice.actions;
export default milkSlice.reducer;
