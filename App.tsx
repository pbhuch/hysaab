import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaView, StatusBar, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { store, useAppSelector, useAppDispatch } from './src/presentation/store';
import { lightTheme, darkTheme } from './src/presentation/theme/theme';
import { StorageService, STORAGE_KEYS } from './src/application/StorageService';

// Import Slices & Actions
import { setSettingsState, setPinVerified } from './src/presentation/store/settingsSlice';
import { setMilkState } from './src/presentation/store/milkSlice';
import { setLaundryState } from './src/presentation/store/laundrySlice';
import { setMaidState } from './src/presentation/store/maidSlice';

// Import Screens
import DashboardScreen from './src/presentation/screens/DashboardScreen';
import MilkLedgerScreen from './src/presentation/screens/MilkLedgerScreen';
import LaundryLedgerScreen from './src/presentation/screens/LaundryLedgerScreen';
import MaidLedgerScreen from './src/presentation/screens/MaidLedgerScreen';
import SettlementsScreen from './src/presentation/screens/SettlementsScreen';
import SettingsScreen from './src/presentation/screens/SettingsScreen';

// Import Components
import PinLockScreen from './src/presentation/components/PinLockScreen';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings.user.settings);
  const isPinEnabled = useAppSelector(state => state.settings.user.settings.pinEnabled);
  const pinHash = useAppSelector(state => state.settings.user.pin_hash);
  const isPinVerified = useAppSelector(state => state.settings.pinVerified);

  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  const colors = settings.theme === 'dark' ? darkTheme : lightTheme;

  // Restore stored data on mount
  useEffect(() => {
    const restoreData = async () => {
      try {
        const savedSettings = await StorageService.load(STORAGE_KEYS.SETTINGS, null);
        if (savedSettings) {
          dispatch(setSettingsState({ user: savedSettings, pinVerified: false }));
        }

        const vendors = await StorageService.load(STORAGE_KEYS.VENDORS, []);
        const milkEntries = await StorageService.load(STORAGE_KEYS.MILK_ENTRIES, []);
        const rateChanges = await StorageService.load(STORAGE_KEYS.RATE_CHANGES, []);
        if (vendors.length > 0 || milkEntries.length > 0 || rateChanges.length > 0) {
          dispatch(setMilkState({
            vendors: vendors.filter((v: any) => v.type === 'milk'),
            entries: milkEntries,
            rateChanges
          }));
        }

        const laundryEntries = await StorageService.load(STORAGE_KEYS.LAUNDRY_ENTRIES, []);
        if (vendors.length > 0 || laundryEntries.length > 0) {
          dispatch(setLaundryState({
            vendors: vendors.filter((v: any) => v.type === 'laundry'),
            entries: laundryEntries
          }));
        }

        const maids = await StorageService.load(STORAGE_KEYS.MAIDS, []);
        const attendance = await StorageService.load(STORAGE_KEYS.MAID_ATTENDANCE, []);
        const payments = await StorageService.load(STORAGE_KEYS.PAYMENTS, []);
        if (maids.length > 0 || attendance.length > 0 || payments.length > 0) {
          dispatch(setMaidState({ maids, attendance, payments }));
        }
      } catch (e) {
        console.error('Error loading stored ledger data:', e);
      } finally {
        setLoading(false);
      }
    };

    restoreData();
  }, [dispatch]);

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen colors={colors} navigate={setActiveScreen} />;
      case 'milk':
        return <MilkLedgerScreen colors={colors} />;
      case 'laundry':
        return <LaundryLedgerScreen colors={colors} />;
      case 'maids':
        return <MaidLedgerScreen colors={colors} />;
      case 'settlements':
        return <SettlementsScreen colors={colors} />;
      case 'settings':
        return <SettingsScreen colors={colors} />;
      default:
        return <DashboardScreen colors={colors} navigate={setActiveScreen} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.primary, fontSize: 18, fontWeight: 'bold' }}>Loading Ledgers...</Text>
      </View>
    );
  }

  // App Lock Interception
  if (isPinEnabled && pinHash && !isPinVerified) {
    return (
      <PinLockScreen
        correctPinHash={pinHash}
        colors={colors}
        onSuccess={() => dispatch(setPinVerified(true))}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={settings.theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Main Content Area */}
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>

      {/* Sleek Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('dashboard')}
        >
          <Text style={styles.tabEmoji}>🏠</Text>
          <Text style={[styles.tabLabel, { color: activeScreen === 'dashboard' ? colors.primary : colors.textMuted }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('milk')}
        >
          <Text style={styles.tabEmoji}>🥛</Text>
          <Text style={[styles.tabLabel, { color: activeScreen === 'milk' ? colors.primary : colors.textMuted }]}>Milk</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('laundry')}
        >
          <Text style={styles.tabEmoji}>🧺</Text>
          <Text style={[styles.tabLabel, { color: activeScreen === 'laundry' ? colors.primary : colors.textMuted }]}>Laundry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('maids')}
        >
          <Text style={styles.tabEmoji}>👤</Text>
          <Text style={[styles.tabLabel, { color: activeScreen === 'maids' ? colors.primary : colors.textMuted }]}>Maids</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('settlements')}
        >
          <Text style={styles.tabEmoji}>📊</Text>
          <Text style={[styles.tabLabel, { color: activeScreen === 'settlements' ? colors.primary : colors.textMuted }]}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveScreen('settings')}
        >
          <Text style={styles.tabEmoji}>⚙️</Text>
          <Text style={[styles.tabLabel, { color: activeScreen === 'settings' ? colors.primary : colors.textMuted }]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 15 : 5,
    paddingTop: 5,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
