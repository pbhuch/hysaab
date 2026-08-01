import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SETTINGS: 'household_ledger_settings',
  VENDORS: 'household_ledger_vendors',
  MILK_ENTRIES: 'household_ledger_milk_entries',
  LAUNDRY_ENTRIES: 'household_ledger_laundry_entries',
  MAIDS: 'household_ledger_maids',
  MAID_ATTENDANCE: 'household_ledger_maid_attendance',
  PAYMENTS: 'household_ledger_payments',
  RATE_CHANGES: 'household_ledger_rate_changes',
};

export class StorageService {
  static async save<T>(key: string, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error(`Error saving data for key ${key}:`, e);
    }
  }

  static async load<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (e) {
      console.error(`Error loading data for key ${key}:`, e);
      return defaultValue;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }

  // Backup and Restore
  static async exportBackup(): Promise<string> {
    try {
      const allKeys = Object.values(STORAGE_KEYS);
      const backupObj: Record<string, any> = {};
      
      for (const key of allKeys) {
        const val = await AsyncStorage.getItem(key);
        backupObj[key] = val ? JSON.parse(val) : null;
      }
      
      return JSON.stringify(backupObj, null, 2);
    } catch (e) {
      console.error('Error exporting backup:', e);
      throw e;
    }
  }

  static async importBackup(backupJson: string): Promise<void> {
    try {
      const backupObj = JSON.parse(backupJson);
      const allKeys = Object.values(STORAGE_KEYS);
      
      for (const key of allKeys) {
        if (backupObj[key] !== undefined) {
          if (backupObj[key] === null) {
            await AsyncStorage.removeItem(key);
          } else {
            await AsyncStorage.setItem(key, JSON.stringify(backupObj[key]));
          }
        }
      }
    } catch (e) {
      console.error('Error importing backup:', e);
      throw e;
    }
  }
}

export { STORAGE_KEYS };
