import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../domain/types';
import { StorageService, STORAGE_KEYS } from '../../application/StorageService';

interface SettingsState {
  user: User;
  pinVerified: boolean;
}

const defaultUser: User = {
  id: 'u_1',
  name: 'Primary Owner',
  phone: '9999999999',
  role: 'owner',
  settings: {
    theme: 'light',
    currency: 'INR',
    pinEnabled: false,
    notificationsEnabled: true,
    milkReminderTime: '07:30',
  },
};

const initialState: SettingsState = {
  user: defaultUser,
  pinVerified: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettingsState: (state, action: PayloadAction<SettingsState>) => {
      state.user = action.payload.user;
      state.pinVerified = action.payload.pinVerified;
    },
    updateUserSetting: (state, action: PayloadAction<Partial<User['settings']>>) => {
      state.user.settings = { ...state.user.settings, ...action.payload };
      StorageService.save(STORAGE_KEYS.SETTINGS, state.user);
    },
    setPin: (state, action: PayloadAction<string>) => {
      state.user.pin_hash = action.payload; // Plain text or hashed
      state.user.settings.pinEnabled = true;
      state.pinVerified = true;
      StorageService.save(STORAGE_KEYS.SETTINGS, state.user);
    },
    disablePin: (state) => {
      state.user.pin_hash = undefined;
      state.user.settings.pinEnabled = false;
      state.pinVerified = false;
      StorageService.save(STORAGE_KEYS.SETTINGS, state.user);
    },
    setPinVerified: (state, action: PayloadAction<boolean>) => {
      state.pinVerified = action.payload;
    },
    setName: (state, action: PayloadAction<string>) => {
      state.user.name = action.payload;
      StorageService.save(STORAGE_KEYS.SETTINGS, state.user);
    }
  },
});

export const { setSettingsState, updateUserSetting, setPin, disablePin, setPinVerified, setName } = settingsSlice.actions;
export default settingsSlice.reducer;
