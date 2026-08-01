import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { Card } from '../components/Card';
import { useAppSelector } from '../store';
import { calculateSalaryForMonth } from '../../application/SalaryCalculator';

interface DashboardScreenProps {
  colors: ThemeColors;
  navigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ colors, navigate }) => {
  const user = useAppSelector(state => state.settings.user);
  const milkState = useAppSelector(state => state.milk);
  const laundryState = useAppSelector(state => state.laundry);
  const maidState = useAppSelector(state => state.maid);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Compute stats for current month (July 2026)
  const currentYear = 2026;
  const currentMonthIdx = 6; // July
  const currentMonthStr = '2026-07';

  // 1. Milk Ledger monthly total
  const milkEntriesThisMonth = milkState.entries.filter(e => e.date.startsWith(currentMonthStr));
  const milkLitres = milkEntriesThisMonth.reduce((sum, e) => sum + e.quantity_ltr, 0);
  const milkCost = milkEntriesThisMonth.reduce((sum, e) => sum + e.total, 0);

  // 2. Laundry Ledger monthly total
  const laundryEntriesThisMonth = laundryState.entries.filter(e => e.date_sent.startsWith(currentMonthStr));
  const laundryCost = laundryEntriesThisMonth.reduce((sum, e) => sum + e.total, 0);
  const pendingLaundryPcs = laundryState.entries
    .filter(e => e.status === 'sent')
    .reduce((sum, e) => sum + Object.values(e.items).reduce((s, v) => s + v, 0), 0);

  // 3. Maid Ledger monthly total
  const totalMaidPayout = maidState.ids?.length === 0 ? 0 : maidState.maids.reduce((sum, maid) => {
    if (!maid.active) return sum;
    const maidAtt = maidState.attendance.filter(att => att.maid_id === maid.id && att.date.startsWith(currentMonthStr));
    const breakdown = calculateSalaryForMonth(maid, maidAtt, currentYear, currentMonthIdx);
    return sum + breakdown.finalSalary;
  }, 0);

  const totalSpentThisMonth = milkCost + laundryCost + totalMaidPayout;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user.name}</Text>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>TOTAL SPENT THIS MONTH</Text>
            <Text style={styles.balanceAmount}>
              {user.settings.currency === 'INR' ? '₹' : '$'}
              {totalSpentThisMonth.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Module Cards */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ledger Modules</Text>

        <TouchableOpacity onPress={() => navigate('milk')} activeOpacity={0.95}>
          <Card colors={colors} style={styles.moduleCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>🥛</Text>
              <View style={styles.cardHeaderInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Milk Ledger</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {milkState.vendors.filter(v => v.active).length} Active Vendors
                </Text>
              </View>
              <Text style={[styles.cardValue, { color: colors.primary }]}>
                ₹{milkCost.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Total volume: <Text style={{ color: colors.text, fontWeight: '600' }}>{milkLitres.toFixed(1)} Litres</Text>
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('laundry')} activeOpacity={0.95}>
          <Card colors={colors} style={styles.moduleCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>🧺</Text>
              <View style={styles.cardHeaderInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Laundry Ledger</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {pendingLaundryPcs > 0 ? `${pendingLaundryPcs} clothes pending return` : 'All clothes received'}
                </Text>
              </View>
              <Text style={[styles.cardValue, { color: colors.primary }]}>
                ₹{laundryCost.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Monthly Spend: <Text style={{ color: colors.text, fontWeight: '600' }}>₹{laundryCost}</Text>
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('maids')} activeOpacity={0.95}>
          <Card colors={colors} style={styles.moduleCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>👤</Text>
              <View style={styles.cardHeaderInfo}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Maids & House Help</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {maidState.maids.filter(m => m.active).length} Active Helpers
                </Text>
              </View>
              <Text style={[styles.cardValue, { color: colors.primary }]}>
                ₹{totalMaidPayout.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                Payout due for <Text style={{ color: colors.text, fontWeight: '600' }}>July 2026</Text>
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Quick Operations */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview & Analytics</Text>

        <Card colors={colors} style={styles.infoCard}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>📊 Expense Trend</Text>
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={[styles.trendLabel, { color: colors.textMuted }]}>June 2026</Text>
              <Text style={[styles.trendVal, { color: colors.text }]}>₹21,000</Text>
            </View>
            <View style={styles.trendDivider} />
            <View style={styles.trendItem}>
              <Text style={[styles.trendLabel, { color: colors.textMuted }]}>July 2026</Text>
              <Text style={[styles.trendVal, { color: colors.primary }]}>₹{totalSpentThisMonth}</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 35,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  greeting: {
    color: '#e0e7ff',
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  balanceContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
  },
  balanceLabel: {
    color: '#e0e7ff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  moduleCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 13,
  },
  infoCard: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  trendVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#cbd5e1',
  },
});
export default DashboardScreen;
