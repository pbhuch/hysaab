import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Maid, MaidAttendance, Payment, Advance } from '../../domain/types';
import { StorageService, STORAGE_KEYS } from '../../application/StorageService';
import { mockMaids, mockMaidAttendance, mockPayments } from '../../data/mockData';

interface MaidState {
  maids: Maid[];
  attendance: MaidAttendance[];
  payments: Payment[];
  advances: Advance[];
}

const initialState: MaidState = {
  maids: mockMaids,
  attendance: mockMaidAttendance,
  payments: mockPayments,
  advances: [],
};

const maidSlice = createSlice({
  name: 'maid',
  initialState,
  reducers: {
    setMaidState: (state, action: PayloadAction<MaidState>) => {
      state.maids = action.payload.maids;
      state.attendance = action.payload.attendance;
      state.payments = action.payload.payments;
      state.advances = action.payload.advances || [];
    },
    addMaid: (state, action: PayloadAction<Maid>) => {
      state.maids.push(action.payload);
      StorageService.save(STORAGE_KEYS.MAIDS, state.maids);
    },
    updateMaid: (state, action: PayloadAction<Maid>) => {
      const idx = state.maids.findIndex(m => m.id === action.payload.id);
      if (idx !== -1) {
        state.maids[idx] = action.payload;
        StorageService.save(STORAGE_KEYS.MAIDS, state.maids);
      }
    },
    logAttendance: (state, action: PayloadAction<MaidAttendance>) => {
      const idx = state.attendance.findIndex(
        att => att.maid_id === action.payload.maid_id && att.date === action.payload.date
      );
      if (idx !== -1) {
        state.attendance[idx] = action.payload;
      } else {
        state.attendance.push(action.payload);
      }
      StorageService.save(STORAGE_KEYS.MAID_ATTENDANCE, state.attendance);
    },
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.unshift(action.payload);
      StorageService.save(STORAGE_KEYS.PAYMENTS, state.payments);
    },
    addAdvance: (state, action: PayloadAction<Advance>) => {
      state.advances.push(action.payload);
      StorageService.save(STORAGE_KEYS.ADVANCES, state.advances);
    },
  },
});

export const { setMaidState, addMaid, updateMaid, logAttendance, addPayment, addAdvance } = maidSlice.actions;
export default maidSlice.reducer;
