import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppSelector, useAppDispatch } from '../store';
import { addPayment } from '../store/maidSlice';
import { updateLaundryEntry } from '../store/laundrySlice';
import { ExportService } from '../../application/ExportService';
import { calculateSalaryForMonth } from '../../application/SalaryCalculator';
import { getSuggestedRate } from '../../application/RateCalculator';

interface SettlementsScreenProps {
  colors: ThemeColors;
}

export const SettlementsScreen: React.FC<SettlementsScreenProps> = ({ colors }) => {
  const dispatch = useAppDispatch();
  
  const milkState = useAppSelector(state => state.milk);
  const laundryState = useAppSelector(state => state.laundry);
  const maidState = useAppSelector(state => state.maid);

  const [activeTab, setActiveTab] = useState<'milk' | 'laundry' | 'maids'>('milk');

  const currentMonthStr = '2026-07';
  const currentMonthName = 'July';
  const currentYear = 2026;

  // 1. Milk Settlement Calculations
  const activeMilkEntries = milkState.entries.filter(e => e.date.startsWith(currentMonthStr));
  const milkVendorsTotals = milkState.vendors.map(v => {
    const vEntries = activeMilkEntries.filter(e => e.vendor_id === v.id);
    const totalQty = vEntries.reduce((sum, e) => sum + e.quantity_ltr, 0);
    const totalAmount = vEntries.reduce((sum, e) => sum + e.total, 0);
    return { vendor: v, totalQty, totalAmount };
  });

  // 2. Laundry Settlement Calculations
  const activeLaundryEntries = laundryState.entries.filter(e => e.date_sent.startsWith(currentMonthStr));
  const laundryVendorsTotals = laundryState.vendors.map(v => {
    const vEntries = activeLaundryEntries.filter(e => e.vendor_id === v.id);
    const totalAmount = vEntries.reduce((sum, e) => sum + e.total, 0);
    const pendingAmount = vEntries.filter(e => e.status === 'sent').reduce((sum, e) => sum + e.total, 0);
    return { vendor: v, totalAmount, pendingAmount, entries: vEntries };
  });

  // 3. Maids Settlement Calculations
  const maidTotals = maidState.maids.map(m => {
    const mAtt = maidState.attendance.filter(a => a.maid_id === m.id && a.date.startsWith(currentMonthStr));
    const breakdown = calculateSalaryForMonth(m, mAtt, currentYear, 6);
    
    // Check if paid in payments
    const isPaid = maidState.payments.some(
      p => p.ref_id === m.id && p.period_start === '2026-07-01' && p.period_end === '2026-07-31'
    );

    return { maid: m, breakdown, isPaid };
  });

  // Export handlers
  const handleCSVExport = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'milk') {
      csvContent = ExportService.convertToCSV(
        activeMilkEntries.map(e => ({
          Date: e.date,
          Vendor: milkState.vendors.find(v => v.id === e.vendor_id)?.name || 'Unknown',
          Quantity: e.quantity_ltr,
          Rate: e.rate_per_ltr,
          Total: e.total,
          Mode: e.payment_mode,
        }))
      );
      filename = 'milk_ledger_july_2026.csv';
    } else if (activeTab === 'laundry') {
      csvContent = ExportService.convertToCSV(
        activeLaundryEntries.map(e => ({
          DateSent: e.date_sent,
          DateReceived: e.date_received || 'Pending',
          Vendor: laundryState.vendors.find(v => v.id === e.vendor_id)?.name || 'Unknown',
          Shirts: e.items.shirts,
          Pants: e.items.pants,
          Bedsheets: e.items.bedsheets,
          Towels: e.items.towels,
          Others: e.items.others,
          Total: e.total,
          Status: e.status,
        }))
      );
      filename = 'laundry_ledger_july_2026.csv';
    } else {
      csvContent = ExportService.convertToCSV(
        maidTotals.map(t => ({
          Name: t.maid.name,
          Role: t.maid.role,
          MonthlyRate: t.maid.monthly_rate,
          ActiveDays: `${t.breakdown.activeDaysInMonth}/${t.breakdown.totalDaysInMonth}`,
          PresentDays: t.breakdown.presentDays,
          PaidLeaves: t.breakdown.paidLeaves,
          UnpaidLeaves: t.breakdown.unpaidLeaves,
          Deductions: t.breakdown.deductions,
          NetPayable: t.breakdown.finalSalary,
          Status: t.isPaid ? 'Settled' : 'Due',
        }))
      );
      filename = 'maids_salary_july_2026.csv';
    }

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('CSV Exported Successfully', csvContent);
    }
  };

  const handleWhatsAppShare = (type: string, data: any) => {
    let text = '';
    if (type === 'milk') {
      const vendor = data.vendor;
      const vEntries = activeMilkEntries.filter(e => e.vendor_id === vendor.id);
      text = ExportService.formatMilkWhatsAppSummary(
        currentMonthName,
        currentYear,
        vendor.name,
        vEntries,
        milkState.rateChanges,
        vendor.base_rate
      );
    } else if (type === 'laundry') {
      const vendor = data.vendor;
      const vEntries = activeLaundryEntries.filter(e => e.vendor_id === vendor.id);
      text = ExportService.formatLaundryWhatsAppSummary(
        currentMonthName,
        currentYear,
        vendor.name,
        vEntries
      );
    } else if (type === 'maid') {
      const m = data.maid;
      const mAtt = maidState.attendance.filter(a => a.maid_id === m.id && a.date.startsWith(currentMonthStr));
      text = ExportService.formatMaidWhatsAppSlip(
        currentMonthName,
        currentYear,
        m,
        mAtt
      );
    }

    // Since this is mock WhatsApp, copy to clipboard / log to console / show alert
    console.log('--- WhatsApp Share Snippet ---');
    console.log(text);
    Alert.alert('WhatsApp Summary Generated (Formatted for Chat)', text);
  };

  const handleSettleMaidSalary = (maidId: string, amount: number) => {
    const pay = {
      id: 'p_maid_' + Date.now(),
      module: 'maid' as const,
      ref_id: maidId,
      period_start: '2026-07-01',
      period_end: '2026-07-31',
      amount,
      paid_on: new Date().toISOString().split('T')[0],
      mode: 'upi' as const,
      note: 'July salary settled',
    };
    dispatch(addPayment(pay));
    Alert.alert('Success', 'Maid salary marked as Settled (UPI Payment simulated)');
  };

  const handleSettleLaundry = (vendorId: string, entries: any[]) => {
    entries.forEach(e => {
      if (e.status === 'sent') {
        dispatch(updateLaundryEntry({ ...e, status: 'received', date_received: new Date().toISOString().split('T')[0] }));
      }
    });
    Alert.alert('Success', 'Laundry vendor bill settled.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sub Header Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'milk' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('milk')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'milk' ? colors.primary : colors.textMuted }]}>
            🥛 Milk
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'laundry' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('laundry')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'laundry' ? colors.primary : colors.textMuted }]}>
            🧺 Laundry
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'maids' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('maids')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'maids' ? colors.primary : colors.textMuted }]}>
            👤 Maids
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Settlements & Reports</Text>
          <Text style={[styles.summaryMonth, { color: colors.primary }]}>Active Month: July 2026</Text>
        </View>

        {activeTab === 'milk' && (
          <View>
            {milkVendorsTotals.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No active milk vendors recorded.</Text>
            ) : (
              milkVendorsTotals.map(({ vendor, totalQty, totalAmount }) => (
                <Card colors={colors} key={vendor.id} style={styles.settleCard}>
                  <Text style={[styles.vendorTitle, { color: colors.text }]}>{vendor.name}</Text>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Total Volume</Text>
                    <Text style={[styles.settleVal, { color: colors.text }]}>{totalQty.toFixed(1)} Litres</Text>
                  </View>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Average Rate</Text>
                    <Text style={[styles.settleVal, { color: colors.text }]}>
                      ₹{getSuggestedRate(vendor.id, '2026-07-28', vendor.base_rate, milkState.rateChanges)}/L
                    </Text>
                  </View>
                  <View style={[styles.settleRow, styles.totalDueRow, { borderTopColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>Total Amount Due</Text>
                    <Text style={[styles.settleValTotal, { color: colors.primary }]}>₹{totalAmount}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <Button
                      title="Share WhatsApp"
                      variant="outline"
                      size="sm"
                      colors={colors}
                      onPress={() => handleWhatsAppShare('milk', { vendor })}
                      style={styles.actionBtn}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'laundry' && (
          <View>
            {laundryVendorsTotals.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No active laundry vendors.</Text>
            ) : (
              laundryVendorsTotals.map(({ vendor, totalAmount, pendingAmount, entries }) => (
                <Card colors={colors} key={vendor.id} style={styles.settleCard}>
                  <Text style={[styles.vendorTitle, { color: colors.text }]}>{vendor.name}</Text>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Total Month Spent</Text>
                    <Text style={[styles.settleVal, { color: colors.text }]}>₹{totalAmount}</Text>
                  </View>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Pending Return Value</Text>
                    <Text style={[styles.settleVal, { color: colors.danger }]}>₹{pendingAmount}</Text>
                  </View>

                  <View style={[styles.settleRow, styles.totalDueRow, { borderTopColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>Balance Due</Text>
                    <Text style={[styles.settleValTotal, { color: colors.primary }]}>₹{pendingAmount}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <Button
                      title="Settle Bill"
                      size="sm"
                      disabled={pendingAmount === 0}
                      colors={colors}
                      onPress={() => handleSettleLaundry(vendor.id, entries)}
                      style={styles.actionBtn}
                    />
                    <Button
                      title="Share WhatsApp"
                      variant="outline"
                      size="sm"
                      colors={colors}
                      onPress={() => handleWhatsAppShare('laundry', { vendor })}
                      style={styles.actionBtn}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'maids' && (
          <View>
            {maidTotals.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No active maids profiles found.</Text>
            ) : (
              maidTotals.map(({ maid, breakdown, isPaid }) => (
                <Card colors={colors} key={maid.id} style={styles.settleCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.vendorTitle, { color: colors.text }]}>{maid.name} ({maid.role.toUpperCase()})</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isPaid ? colors.success + '20' : colors.warning + '20' }]}>
                      <Text style={{ color: isPaid ? colors.success : colors.warning, fontSize: 11, fontWeight: 'bold' }}>
                        {isPaid ? 'SETTLED' : 'DUE'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Base Monthly Salary</Text>
                    <Text style={[styles.settleVal, { color: colors.text }]}>₹{maid.monthly_rate}</Text>
                  </View>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Attendance Ratio</Text>
                    <Text style={[styles.settleVal, { color: colors.text }]}>
                      {breakdown.activeDaysInMonth}/{breakdown.totalDaysInMonth} days active
                    </Text>
                  </View>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Present Days</Text>
                    <Text style={[styles.settleVal, { color: colors.text }]}>{breakdown.presentDays} days</Text>
                  </View>
                  <View style={styles.settleRow}>
                    <Text style={{ color: colors.textMuted }}>Unpaid Leaves</Text>
                    <Text style={[styles.settleVal, { color: colors.danger }]}>
                      {breakdown.unpaidLeaves} days (Deduction: -₹{breakdown.deductions})
                    </Text>
                  </View>

                  <View style={[styles.settleRow, styles.totalDueRow, { borderTopColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>Net Payable</Text>
                    <Text style={[styles.settleValTotal, { color: colors.primary }]}>₹{breakdown.finalSalary}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <Button
                      title="Mark Paid"
                      disabled={isPaid}
                      size="sm"
                      colors={colors}
                      onPress={() => handleSettleMaidSalary(maid.id, breakdown.finalSalary)}
                      style={styles.actionBtn}
                    />
                    <Button
                      title="Salary Slip"
                      variant="outline"
                      size="sm"
                      colors={colors}
                      onPress={() => handleWhatsAppShare('maid', { maid })}
                      style={styles.actionBtn}
                    />
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        <View style={styles.exportSection}>
          <Button
            title="📥 Export Current Ledger to CSV"
            variant="outline"
            colors={colors}
            onPress={handleCSVExport}
            style={styles.fullExportBtn}
          />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryMonth: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  settleCard: {
    marginBottom: 16,
  },
  vendorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  settleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settleVal: {
    fontWeight: '500',
  },
  totalDueRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  settleValTotal: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    flex: 0.48,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exportSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  fullExportBtn: {
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 40,
  },
});
export default SettlementsScreen;
