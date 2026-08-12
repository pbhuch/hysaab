import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaView, StatusBar, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { store, useAppSelector, useAppDispatch } from './src/presentation/store';
import { lightTheme, darkTheme } from './src/presentation/theme/theme';
import { StorageService, STORAGE_KEYS } from './src/application/StorageService';
import { AppIcon, IconName } from './src/presentation/components/Icon';

// Import Slices & Actions
import { setSettingsState, setPinVerified } from './src/presentation/store/settingsSlice';
import { setMilkState } from './src/presentation/store/milkSlice';
import { setLaundryState } from './src/presentation/store/laundrySlice';
import { setMaidState } from './src/presentation/store/maidSlice';
import { setContactsState } from './src/presentation/store/contactsSlice';
import { setHouseholdState } from './src/presentation/store/householdSlice';

// Import Screens
import DashboardScreen from './src/presentation/screens/DashboardScreen';
import MilkLedgerScreen from './src/presentation/screens/MilkLedgerScreen';
import LaundryLedgerScreen from './src/presentation/screens/LaundryLedgerScreen';
import MaidLedgerScreen from './src/presentation/screens/MaidLedgerScreen';
import DirectoryScreen from './src/presentation/screens/DirectoryScreen';
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

        const contacts = await StorageService.load(STORAGE_KEYS.CONTACTS, null);
        if (contacts && contacts.length > 0) {
          dispatch(setContactsState(contacts));
        }

        const household = await StorageService.load(STORAGE_KEYS.HOUSEHOLD, null);
        const dismissedAlerts = await StorageService.load(STORAGE_KEYS.DISMISSED_ALERTS, []);
        if (household) {
          dispatch(setHouseholdState({ profile: household, dismissedAlertIds: dismissedAlerts }));
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
      case 'directory':
        return <DirectoryScreen colors={colors} />;
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

  const tabs: { id: string; label: string; icon: IconName }[] = [
    { id: 'dashboard', label: 'Home', icon: 'house' },
    { id: 'milk', label: 'Milk', icon: 'milk' },
    { id: 'laundry', label: 'Laundry', icon: 'laundry' },
    { id: 'maids', label: 'House Help', icon: 'maids' },
    { id: 'directory', label: 'Contacts', icon: 'directory' },
    { id: 'settlements', label: 'Reports', icon: 'reports' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={settings.theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Main Content Area */}
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>

      {/* Crisp & Intuitive Bottom Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {tabs.map(tab => {
          const isActive = activeScreen === tab.id;
          const activeBg = colors.theme === 'dark' ? 'rgba(129, 140, 248, 0.18)' : '#eef2ff';
          const iconColor = isActive ? colors.primary : colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveScreen(tab.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconPill,
                  isActive && { backgroundColor: activeBg },
                ]}
              >
                <AppIcon
                  name={tab.icon}
                  size={20}
                  color={iconColor}
                  strokeWidth={isActive ? 2.6 : 2}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: iconColor,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    height: 68,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 14 : 6,
    paddingTop: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
  },
});
