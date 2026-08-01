import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { CalendarView } from '../components/CalendarView';
import { useAppSelector, useAppDispatch } from '../store';
import { addMaid, logAttendance } from '../store/maidSlice';
import { calculateSalaryForMonth } from '../../application/SalaryCalculator';
import { Maid, MaidAttendance, AttendanceStatus } from '../../domain/types';

interface MaidLedgerScreenProps {
  colors: ThemeColors;
}

export const MaidLedgerScreen: React.FC<MaidLedgerScreenProps> = ({ colors }) => {
  const dispatch = useAppDispatch();
  const maidState = useAppSelector(state => state.maid);

  const [selectedMaid, setSelectedMaid] = useState<Maid | null>(null);

  // Modals visibility
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);

  // Add Maid Form state
  const [mName, setMName] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mRole, setMRole] = useState<'cook' | 'cleaning' | 'nanny' | 'driver'>('cook');
  const [mRate, setMRate] = useState('5000');
  const [mCycleStart, setMCycleStart] = useState('1');
  const [mJoinedDate, setMJoinedDate] = useState(new Date().toISOString().split('T')[0]);

  // Attendance Form state (when date clicked)
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>('present');
  const [attendanceNote, setAttendanceNote] = useState('');

  // Calendar configuration (Default to July 2026)
  const [currentYear] = useState(2026);
  const [currentMonthIdx] = useState(6); // July

  const submitMaid = () => {
    if (!mName || !mPhone || !mRate) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    const rate = parseFloat(mRate);
    const cycle = parseInt(mCycleStart);

    const newHelper: Maid = {
      id: 'm_' + Date.now(),
      name: mName,
      role: mRole,
      phone: mPhone,
      monthly_rate: rate,
      payment_cycle_start: cycle,
      active: true,
      joined_date: mJoinedDate,
    };

    dispatch(addMaid(newHelper));
    setProfileModalVisible(false);
    // Reset Form
    setMName('');
    setMPhone('');
    setMRate('5000');
    setMCycleStart('1');
  };

  const handleDatePress = (dateStr: string, currentStatus?: AttendanceStatus) => {
    setSelectedDate(dateStr);
    setSelectedStatus(currentStatus || 'present');
    setAttendanceNote('');
    setAttendanceModalVisible(true);
  };

  const submitAttendance = () => {
    if (!selectedMaid) return;

    const newAtt: MaidAttendance = {
      id: `att_${selectedMaid.id}_${selectedDate}`,
      maid_id: selectedMaid.id,
      date: selectedDate,
      status: selectedStatus,
      note: attendanceNote || undefined,
    };

    dispatch(logAttendance(newAtt));
    setAttendanceModalVisible(false);
  };

  const getAttendanceMap = (maidId: string) => {
    const map: Record<string, AttendanceStatus> = {};
    maidState.attendance
      .filter(att => att.maid_id === maidId)
      .forEach(att => {
        map[att.date] = att.status;
      });
    return map;
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'cook': return '🍳';
      case 'cleaning': return '🧹';
      case 'nanny': return '👶';
      case 'driver': return '🚗';
      default: return '👤';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedMaid ? (
        // Detailed Profile & Attendance View
        <ScrollView contentContainerStyle={styles.detailContainer}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => setSelectedMaid(null)}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>← Back to Helpers list</Text>
          </TouchableOpacity>

          <Card colors={colors} style={styles.profileHeaderCard}>
            <View style={styles.profileRow}>
              <Text style={styles.roleEmoji}>{getRoleEmoji(selectedMaid.role)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.maidName, { color: colors.text }]}>{selectedMaid.name}</Text>
                <Text style={[styles.maidRoleSub, { color: colors.textMuted }]}>
                  {selectedMaid.role.toUpperCase()} • 📞 {selectedMaid.phone}
                </Text>
                <Text style={[styles.maidJoinSub, { color: colors.textMuted }]}>
                  Joined on: {selectedMaid.joined_date}
                </Text>
              </View>
            </View>

            <View style={[styles.payoutSummary, { borderTopColor: colors.border }]}>
              <View style={styles.payoutCol}>
                <Text style={[styles.payoutLabel, { color: colors.textMuted }]}>Monthly Pay</Text>
                <Text style={[styles.payoutVal, { color: colors.text }]}>₹{selectedMaid.monthly_rate}</Text>
              </View>
              <View style={styles.payoutCol}>
                <Text style={[styles.payoutLabel, { color: colors.textMuted }]}>Net Due (July)</Text>
                <Text style={[styles.payoutVal, { color: colors.primary }]}>
                  ₹{calculateSalaryForMonth(
                    selectedMaid,
                    maidState.attendance.filter(a => a.maid_id === selectedMaid.id && a.date.startsWith('2026-07')),
                    currentYear,
                    currentMonthIdx
                  ).finalSalary}
                </Text>
              </View>
            </View>
          </Card>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>July 2026 Attendance Tracker</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Tap a date inside the grid to log presence, unpaid leaves, or half-days.
          </Text>

          <Card colors={colors} style={{ padding: 12 }}>
            <CalendarView
              year={currentYear}
              month={currentMonthIdx}
              attendanceMap={getAttendanceMap(selectedMaid.id)}
              colors={colors}
              onDatePress={handleDatePress}
            />
          </Card>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        // List of maids
        <FlatList
          data={maidState.maids}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              title="No Household Helpers Registered"
              description="Keep track of attendance calendars, monthly base rates, and automatic unpaid leave pay deductions."
              colors={colors}
              tip="Add a cook, nanny, cleaner or driver to log attendance and auto-compute settlements."
            />
          }
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedMaid(item)} activeOpacity={0.95}>
              <Card colors={colors} style={styles.maidCard}>
                <View style={styles.profileRow}>
                  <Text style={styles.roleEmoji}>{getRoleEmoji(item.role)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.maidName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.maidRoleSub, { color: colors.textMuted }]}>
                      {item.role.toUpperCase()} | Cycle starts on {item.payment_cycle_start}st
                    </Text>
                  </View>
                  <Text style={[styles.rateLabel, { color: colors.primary }]}>
                    ₹{item.monthly_rate}/mo
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Button to register helper */}
      {!selectedMaid && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => setProfileModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Add Maid Profile Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Register Helper Profile</Text>
            <ScrollView>
              <Input label="Full Name" value={mName} onChangeText={setMName} colors={colors} />
              <Input label="Phone Number" value={mPhone} onChangeText={setMPhone} keyboardType="phone-pad" colors={colors} />
              
              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Role</Text>
              <View style={styles.vendorSelectorRow}>
                {(['cook', 'cleaning', 'nanny', 'driver'] as const).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.selectorChip,
                      { borderColor: colors.border },
                      mRole === role && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setMRole(role)}
                  >
                    <Text style={{ color: mRole === role ? '#ffffff' : colors.text }}>{role.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input label="Monthly Rate (₹)" value={mRate} onChangeText={setMRate} keyboardType="numeric" colors={colors} />
              <Input label="Payment Cycle Start Date" value={mCycleStart} onChangeText={setMCycleStart} keyboardType="numeric" colors={colors} />
              <Input label="Joined Date (YYYY-MM-DD)" value={mJoinedDate} onChangeText={setMJoinedDate} colors={colors} />

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setProfileModalVisible(false)} style={styles.modalBtn} />
                <Button title="Save Profile" colors={colors} onPress={submitMaid} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Log Attendance Modal */}
      <Modal visible={attendanceModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Log Attendance for {selectedDate}</Text>
            <ScrollView>
              <Text style={[styles.selectLabel, { color: colors.textMuted }]}>Attendance Status</Text>
              <View style={styles.vendorSelectorRow}>
                {(['present', 'absent_paid', 'absent_unpaid', 'half_day'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.selectorChip,
                      { borderColor: colors.border },
                      selectedStatus === status && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text style={{ color: selectedStatus === status ? '#ffffff' : colors.text }}>{status.toUpperCase().replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Note / Comments"
                value={attendanceNote}
                onChangeText={setAttendanceNote}
                colors={colors}
              />

              <View style={styles.modalButtons}>
                <Button title="Cancel" variant="outline" colors={colors} onPress={() => setAttendanceModalVisible(false)} style={styles.modalBtn} />
                <Button title="Log Status" colors={colors} onPress={submitAttendance} style={styles.modalBtn} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listPadding: {
    padding: 16,
  },
  detailContainer: {
    padding: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  profileHeaderCard: {
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  maidName: {
    fontSize: 18,
    fontWeight: '700',
  },
  maidRoleSub: {
    fontSize: 13,
    marginTop: 2,
  },
  maidJoinSub: {
    fontSize: 11,
    marginTop: 2,
  },
  rateLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  payoutSummary: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  payoutCol: {
    flex: 1,
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  payoutVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
  },
  maidCard: {
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    zIndex: 10,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 36,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  vendorSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  selectorChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  modalBtn: {
    flex: 0.48,
  },
});
export default MaidLedgerScreen;
