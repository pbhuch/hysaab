import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScheduledReminder {
  id: string;
  title: string;
  body: string;
  scheduleType: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM
  dayOfWeek?: number; // 0-6 (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  enabled: boolean;
}

export class ReminderService {
  private static STORAGE_KEY = 'household_ledger_scheduled_reminders';

  static async getReminders(): Promise<ScheduledReminder[]> {
    try {
      const defaultReminders: ScheduledReminder[] = [
        {
          id: 'milk_daily',
          title: '🥛 Daily Milk Log',
          body: 'Remember to enter today’s milk delivery details!',
          scheduleType: 'daily',
          time: '07:30',
          enabled: true,
        },
        {
          id: 'laundry_weekly',
          title: '🧺 Laundry Reconciliation',
          body: 'Time to check on sent clothes and reconcile with vendor!',
          scheduleType: 'weekly',
          time: '18:00',
          dayOfWeek: 0, // Sunday
          enabled: true,
        },
        {
          id: 'maid_monthly',
          title: '👤 Maid Payment Reminder',
          body: 'Check maid attendance and settle monthly payments!',
          scheduleType: 'monthly',
          time: '10:00',
          dayOfMonth: 1, // 1st of month
          enabled: true,
        },
      ];

      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultReminders;
    } catch {
      return [];
    }
  }

  static async saveReminders(reminders: ScheduledReminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
      console.log('Successfully scheduled reminders locally:');
      reminders.forEach(r => {
        if (r.enabled) {
          console.log(`- [${r.scheduleType.toUpperCase()}] "${r.title}" scheduled at ${r.time}`);
        }
      });
    } catch (e) {
      console.error('Error saving reminders:', e);
    }
  }
}
