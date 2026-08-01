import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAppSelector, useAppDispatch } from '../store';
import { updateUserSetting, setPin, disablePin, setName } from '../store/settingsSlice';
import { StorageService } from '../../application/StorageService';
import { ReminderService, ScheduledReminder } from '../../application/ReminderService';

interface SettingsScreenProps {
  colors: ThemeColors;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ colors }) => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings.user.settings);
  const userName = useAppSelector(state => state.settings.user.name);

  const [nameInput, setNameInput] = useState(userName);
  const [pinInput, setPinInput] = useState('');
  const [pinSetupVisible, setPinSetupVisible] = useState(false);

  // Reminders config list
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    const list = await ReminderService.getReminders();
    setReminders(list);
  };

  const handleToggleReminder = async (index: number) => {
    const updated = [...reminders];
    updated[index].enabled = !updated[index].enabled;
    setReminders(updated);
    await ReminderService.saveReminders(updated);
  };

  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    dispatch(updateUserSetting({ theme: newTheme }));
  };

  const handleCurrencyToggle = () => {
    const newCurrency = settings.currency === 'INR' ? 'USD' : 'INR';
    dispatch(updateUserSetting({ currency: newCurrency }));
  };

  const handleSaveName = () => {
    dispatch(setName(nameInput));
    Alert.alert('Success', 'Profile name updated successfully.');
  };

  const handlePinToggle = () => {
    if (settings.pinEnabled) {
      dispatch(disablePin());
      setPinInput('');
      Alert.alert('PIN Disabled', 'App lock security is now turned off.');
    } else {
      setPinSetupVisible(true);
    }
  };

  const handleSavePin = () => {
    if (pinInput.length !== 4 || isNaN(Number(pinInput))) {
      Alert.alert('Invalid PIN', 'Please enter a valid 4-digit numeric code.');
      return;
    }
    dispatch(setPin(pinInput));
    setPinSetupVisible(false);
    Alert.alert('PIN Configured', 'App lock is now enabled with the specified PIN.');
  };

  const handleExportBackup = async () => {
    try {
      const backupStr = await StorageService.exportBackup();
      if (Platform.OS === 'web') {
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `household_ledger_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Backup Exported', 'Local JSON backup file downloaded successfully.');
      } else {
        Alert.alert('Backup Data Generated', backupStr);
      }
    } catch {
      Alert.alert('Error', 'Failed to generate backup.');
    }
  };

  const handleImportBackup = () => {
    Alert.prompt(
      'Import Backup',
      'Paste your backup JSON content below:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async (text) => {
            if (!text) return;
            try {
              await StorageService.importBackup(text);
              Alert.alert('Success', 'Backup imported. Please restart the app.');
            } catch {
              Alert.alert('Import Failed', 'Invalid backup format.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      {/* User Profile section */}
      <Card colors={colors} style={styles.card}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>User Profile</Text>
        <Input
          label="Profile Name"
          value={nameInput}
          onChangeText={setNameInput}
          colors={colors}
        />
        <Button title="Save Profile Name" colors={colors} onPress={handleSaveName} style={styles.saveBtn} />
      </Card>

      {/* Display & Layout preferences */}
      <Card colors={colors} style={styles.card}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Preferences</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            <Text style={[styles.settingSub, { color: colors.textMuted }]}>Toggle dark visual theme</Text>
          </View>
          <Switch value={settings.theme === 'dark'} onValueChange={handleThemeToggle} />
        </View>

        <View style={[styles.settingRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Currency Symbol</Text>
            <Text style={[styles.settingSub, { color: colors.textMuted }]}>
              Current: {settings.currency === 'INR' ? 'Rupee (₹)' : 'Dollar ($)'}
            </Text>
          </View>
          <Switch value={settings.currency === 'INR'} onValueChange={handleCurrencyToggle} />
        </View>
      </Card>

      {/* App Lock & Security section */}
      <Card colors={colors} style={styles.card}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>App Security</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>PIN App Lock</Text>
            <Text style={[styles.settingSub, { color: colors.textMuted }]}>Require 4-digit PIN authentication on startup</Text>
          </View>
          <Switch value={settings.pinEnabled} onValueChange={handlePinToggle} />
        </View>

        {pinSetupVisible && (
          <View style={styles.pinSetupBox}>
            <Input
              label="Define 4-Digit Numeric PIN"
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              colors={colors}
            />
            <View style={styles.pinSetupBtns}>
              <Button title="Cancel" variant="outline" size="sm" colors={colors} onPress={() => setPinSetupVisible(false)} style={styles.pinBtn} />
              <Button title="Enable Lock" size="sm" colors={colors} onPress={handleSavePin} style={styles.pinBtn} />
            </View>
          </View>
        )}
      </Card>

      {/* Daily Reminders config list */}
      <Card colors={colors} style={styles.card}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Notifications & Reminders</Text>
        
        {reminders.map((r, index) => (
          <View key={r.id} style={[styles.settingRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{r.title}</Text>
              <Text style={[styles.settingSub, { color: colors.textMuted }]}>{r.body} ({r.time})</Text>
            </View>
            <Switch value={r.enabled} onValueChange={() => handleToggleReminder(index)} />
          </View>
        ))}
      </Card>

      {/* Backup and restore */}
      <Card colors={colors} style={styles.card}>
        <Text style={[styles.sectionHeader, { color: colors.text }]}>Local Data Backup</Text>
        <Text style={[styles.settingSub, { color: colors.textMuted, marginBottom: 16 }]}>
          Export all ledger logs and vendors list into a single JSON file. You can import this file to restore data.
        </Text>
        <View style={styles.backupBtns}>
          <Button title="📤 Export Backup" variant="outline" colors={colors} onPress={handleExportBackup} style={styles.bkpBtn} />
          <Button title="📥 Import Backup" colors={colors} onPress={handleImportBackup} style={styles.bkpBtn} />
        </View>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 12,
  },
  pinSetupBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
  },
  pinSetupBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pinBtn: {
    flex: 0.48,
  },
  backupBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bkpBtn: {
    flex: 0.48,
  },
});
export default SettingsScreen;
